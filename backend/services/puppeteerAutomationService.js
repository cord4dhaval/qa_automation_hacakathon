const puppeteer = require("puppeteer");
const OpenAI = require("openai");
const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();

class PuppeteerAutomationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.browser = null;
    this.screenshotDir = path.join(process.cwd(), "screenshots");
    this.pdfDir = path.join(process.cwd(), "pdfs");
    this.initDirectories();
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
      await fs.mkdir(this.pdfDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create directories:", error);
    }
  }

  async initBrowser() {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: process.env.PUPPETEER_HEADLESS !== "false",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--window-size=1920,1080",
          ],
          timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 60000,
          protocolTimeout: 120000,
        });
        console.log("✅ Puppeteer browser initialized for automation");
      } catch (error) {
        console.error("❌ Failed to initialize Puppeteer browser:", error);
        throw error;
      }
    }
  }

  async parseAutomationCriteria(acceptanceCriteria) {
    try {
      const prompt = `
        Parse these acceptance criteria into specific automation tasks. The user wants to automate browser tasks using Puppeteer.
        
        Acceptance Criteria:
        ${JSON.stringify(acceptanceCriteria, null, 2)}
        
        Generate automation steps for the following capabilities:
        1. Web scraping - Extract specific data from the page
        2. Automated testing - Test user interactions and functionality
        3. PDF & screenshot generation - Capture page content
        4. Form submission & navigation - Fill forms and navigate pages
        5. SPA crawling - Handle JavaScript-heavy single page applications
        6. General automation - Any browser-based repetitive tasks
        
        Return a JSON array of automation steps with this structure:
        [
          {
            "stepId": "unique_id",
            "category": "scraping|testing|pdf_generation|screenshot|form_submission|navigation|spa_crawling|automation",
            "action": "navigate|click|type|extract_text|extract_images|extract_data|wait|scroll|screenshot|pdf|verify|submit_form|wait_for_element|execute_script",
            "description": "Clear description of what this step does",
            "selector": "CSS selector or null for navigation/wait actions",
            "value": "text to type, URL to navigate to, or expected result",
            "waitCondition": "networkidle2|domcontentloaded|load|visible|hidden",
            "timeout": 10000,
            "extractOptions": {
              "dataType": "text|images|links|tables|forms|all",
              "attributes": ["href", "src", "alt", "title"],
              "includeMetadata": true
            },
            "screenshotOptions": {
              "fullPage": true,
              "quality": 90,
              "format": "png|jpeg"
            },
            "pdfOptions": {
              "format": "A4",
              "printBackground": true,
              "margin": {"top": "1cm", "bottom": "1cm", "left": "1cm", "right": "1cm"}
            }
          }
        ]
        
        Focus on automating real browser tasks that users would typically do manually.
        Include verification steps to ensure actions completed successfully.
        Make the automation intelligent and robust with proper error handling.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a browser automation expert. Create comprehensive automation workflows using Puppeteer capabilities.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to parse AI response");
    } catch (error) {
      console.error("❌ Failed to parse automation criteria:", error);
      return this.generateFallbackAutomation(acceptanceCriteria);
    }
  }

  generateFallbackAutomation(acceptanceCriteria) {
    const steps = [
      {
        stepId: "navigate_to_page",
        category: "navigation",
        action: "navigate",
        description: "Navigate to the target page",
        selector: null,
        value: acceptanceCriteria.targetUrl || "",
        waitCondition: "networkidle2",
        timeout: 30000,
      },
    ];

    // Set default values if not provided
    const extractData = acceptanceCriteria.extractData !== false; // Default true
    const generateScreenshots =
      acceptanceCriteria.generateScreenshots !== false; // Default true
    const generatePDF = acceptanceCriteria.generatePDF === true; // Default false
    const testForms = acceptanceCriteria.testForms !== false; // Default true
    const crawlSPA = acceptanceCriteria.crawlSPA === true; // Default false

    // Always extract data and take screenshots unless explicitly disabled
    if (extractData) {
      steps.push({
        stepId: "scrape_content",
        category: "scraping",
        action: "extract_data",
        description: "Extract all page content and metadata",
        selector: "body",
        value: "full_page_data",
        extractOptions: {
          dataType: "all",
          includeMetadata: true,
        },
        timeout: 15000,
      });
    }

    if (generateScreenshots) {
      steps.push({
        stepId: "take_screenshot",
        category: "screenshot",
        action: "screenshot",
        description: "Take a full page screenshot",
        selector: null,
        value: "page_screenshot.png",
        screenshotOptions: {
          fullPage: true,
          quality: 90,
          format: "png",
        },
        timeout: 10000,
      });
    }

    // PDF generation if requested
    if (generatePDF) {
      steps.push({
        stepId: "generate_pdf",
        category: "pdf_generation",
        action: "pdf",
        description: "Generate PDF of the page",
        selector: null,
        value: "page_document.pdf",
        pdfOptions: {
          format: "A4",
          printBackground: true,
          margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
        },
        timeout: 20000,
      });
    }

    // Form testing if requested
    if (testForms) {
      steps.push({
        stepId: "test_forms",
        category: "testing",
        action: "verify",
        description: "Test form elements and interactions",
        selector: "form",
        value: "forms tested",
        timeout: 10000,
      });
    }

    // Parse content-based automation from acceptance criteria text
    const content =
      acceptanceCriteria.content ||
      acceptanceCriteria.automationTasks?.[0] ||
      "";
    const contentLower = content.toLowerCase();

    // Look for specific automation keywords in acceptance criteria
    if (contentLower.includes("login") || contentLower.includes("sign in")) {
      steps.push({
        stepId: "test_login",
        category: "testing",
        action: "verify",
        description: "Test login functionality based on acceptance criteria",
        selector: "form",
        value: "login form tested",
        timeout: 15000,
      });
    }

    if (contentLower.includes("form") || contentLower.includes("submit")) {
      steps.push({
        stepId: "test_form_submission",
        category: "form_submission",
        action: "verify",
        description: "Test form submission based on acceptance criteria",
        selector: "form",
        value: "form submission tested",
        timeout: 15000,
      });
    }

    if (contentLower.includes("click") || contentLower.includes("button")) {
      steps.push({
        stepId: "test_interactions",
        category: "testing",
        action: "verify",
        description: "Test button clicks and interactions",
        selector: "button, .btn, [role='button']",
        value: "interactions tested",
        timeout: 10000,
      });
    }

    return steps;
  }

  async executeAutomationStep(page, step, stepIndex) {
    const result = {
      stepId: step.stepId,
      stepIndex,
      category: step.category,
      action: step.action,
      description: step.description,
      status: "pending",
      evidence: "",
      data: null,
      files: [],
      error: null,
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    const startTime = Date.now();

    try {
      switch (step.action) {
        case "navigate":
          await this.performNavigation(page, step, result);
          break;
        case "click":
          await this.performClick(page, step, result);
          break;
        case "type":
          await this.performType(page, step, result);
          break;
        case "extract_text":
          await this.performTextExtraction(page, step, result);
          break;
        case "extract_images":
          await this.performImageExtraction(page, step, result);
          break;
        case "extract_data":
          await this.performDataExtraction(page, step, result);
          break;
        case "screenshot":
          await this.performScreenshot(page, step, result);
          break;
        case "pdf":
          await this.performPDFGeneration(page, step, result);
          break;
        case "wait":
          await this.performWait(page, step, result);
          break;
        case "scroll":
          await this.performScroll(page, step, result);
          break;
        case "submit_form":
          await this.performFormSubmission(page, step, result);
          break;
        case "wait_for_element":
          await this.performWaitForElement(page, step, result);
          break;
        case "execute_script":
          await this.performScriptExecution(page, step, result);
          break;
        case "verify":
          await this.performVerification(page, step, result);
          break;
        default:
          throw new Error(`Unknown automation action: ${step.action}`);
      }

      result.status = "completed";
    } catch (error) {
      result.status = "failed";
      result.error = error.message;
      result.evidence = `Step failed: ${error.message}`;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async performNavigation(page, step, result) {
    try {
      await page.goto(step.value, {
        waitUntil: step.waitCondition || "networkidle2",
        timeout: step.timeout || 30000,
      });

      const currentUrl = page.url();
      const title = await page.title();

      result.evidence = `Successfully navigated to: ${currentUrl}`;
      result.data = { url: currentUrl, title };
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  async performClick(page, step, result) {
    try {
      await page.waitForSelector(step.selector, {
        timeout: step.timeout || 10000,
      });
      await page.click(step.selector);
      await page.waitForTimeout(1000); // Wait for any animations

      result.evidence = `Successfully clicked element: ${step.selector}`;
    } catch (error) {
      throw new Error(`Click failed: ${error.message}`);
    }
  }

  async performType(page, step, result) {
    try {
      await page.waitForSelector(step.selector, {
        timeout: step.timeout || 10000,
      });
      await page.click(step.selector); // Focus the element
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      await page.type(step.selector, step.value);

      result.evidence = `Successfully typed "${step.value}" into: ${step.selector}`;
    } catch (error) {
      throw new Error(`Type failed: ${error.message}`);
    }
  }

  async performTextExtraction(page, step, result) {
    try {
      if (step.selector) {
        await page.waitForSelector(step.selector, {
          timeout: step.timeout || 10000,
        });
        const text = await page.$eval(step.selector, (el) => el.textContent);
        result.data = { extractedText: text };
        result.evidence = `Extracted text from ${
          step.selector
        }: ${text.substring(0, 100)}...`;
      } else {
        const text = await page.evaluate(() => document.body.textContent);
        result.data = { extractedText: text };
        result.evidence = `Extracted full page text (${text.length} characters)`;
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  async performImageExtraction(page, step, result) {
    try {
      const images = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs.map((img) => ({
          src: img.src,
          alt: img.alt,
          title: img.title,
          width: img.naturalWidth,
          height: img.naturalHeight,
          loading: img.loading,
        }));
      });

      result.data = { images };
      result.evidence = `Extracted ${images.length} images from the page`;
    } catch (error) {
      throw new Error(`Image extraction failed: ${error.message}`);
    }
  }

  async performDataExtraction(page, step, result) {
    try {
      const extractOptions = step.extractOptions || { dataType: "all" };

      const pageData = await page.evaluate((options) => {
        const data = {};

        // Extract text content
        if (options.dataType === "all" || options.dataType === "text") {
          data.title = document.title;
          data.headings = {};
          for (let i = 1; i <= 6; i++) {
            const headings = Array.from(document.querySelectorAll(`h${i}`));
            data.headings[`h${i}`] = headings.map((h) => h.textContent.trim());
          }
          data.paragraphs = Array.from(document.querySelectorAll("p")).map(
            (p) => p.textContent.trim()
          );
          data.bodyText = document.body.textContent.trim();
        }

        // Extract images
        if (options.dataType === "all" || options.dataType === "images") {
          data.images = Array.from(document.querySelectorAll("img")).map(
            (img) => ({
              src: img.src,
              alt: img.alt,
              title: img.title,
              width: img.naturalWidth,
              height: img.naturalHeight,
            })
          );
        }

        // Extract links
        if (options.dataType === "all" || options.dataType === "links") {
          data.links = Array.from(document.querySelectorAll("a[href]")).map(
            (link) => ({
              href: link.href,
              text: link.textContent.trim(),
              title: link.title,
            })
          );
        }

        // Extract tables
        if (options.dataType === "all" || options.dataType === "tables") {
          data.tables = Array.from(document.querySelectorAll("table")).map(
            (table) => {
              const rows = Array.from(table.querySelectorAll("tr"));
              return rows.map((row) => {
                const cells = Array.from(row.querySelectorAll("td, th"));
                return cells.map((cell) => cell.textContent.trim());
              });
            }
          );
        }

        // Extract forms
        if (options.dataType === "all" || options.dataType === "forms") {
          data.forms = Array.from(document.querySelectorAll("form")).map(
            (form) => ({
              action: form.action,
              method: form.method,
              inputs: Array.from(
                form.querySelectorAll("input, select, textarea")
              ).map((input) => ({
                type: input.type || input.tagName.toLowerCase(),
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
                required: input.required,
                value: input.value,
              })),
            })
          );
        }

        // Extract metadata
        if (options.includeMetadata) {
          data.metadata = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: document.documentElement.lang,
            charset: document.characterSet,
            metaTags: Array.from(document.querySelectorAll("meta")).map(
              (meta) => ({
                name: meta.name,
                property: meta.property,
                content: meta.content,
              })
            ),
            scripts: Array.from(document.querySelectorAll("script")).length,
            stylesheets: Array.from(
              document.querySelectorAll('link[rel="stylesheet"]')
            ).length,
          };
        }

        return data;
      }, extractOptions);

      result.data = pageData;
      result.evidence = `Successfully extracted ${extractOptions.dataType} data from the page`;
    } catch (error) {
      throw new Error(`Data extraction failed: ${error.message}`);
    }
  }

  async performScreenshot(page, step, result) {
    try {
      const options = step.screenshotOptions || {
        fullPage: true,
        quality: 90,
        format: "png",
      };
      const filename = step.value || `screenshot_${Date.now()}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({
        path: filepath,
        fullPage: options.fullPage,
        quality: options.quality,
        type: options.format,
      });

      result.files.push({
        type: "screenshot",
        filename,
        path: filepath,
        size: (await fs.stat(filepath)).size,
      });
      result.evidence = `Screenshot saved: ${filename}`;
    } catch (error) {
      throw new Error(`Screenshot failed: ${error.message}`);
    }
  }

  async performPDFGeneration(page, step, result) {
    try {
      const options = step.pdfOptions || {
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
      };
      const filename = step.value || `document_${Date.now()}.pdf`;
      const filepath = path.join(this.pdfDir, filename);

      await page.pdf({
        path: filepath,
        format: options.format,
        printBackground: options.printBackground,
        margin: options.margin,
      });

      result.files.push({
        type: "pdf",
        filename,
        path: filepath,
        size: (await fs.stat(filepath)).size,
      });
      result.evidence = `PDF saved: ${filename}`;
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  async performWait(page, step, result) {
    try {
      const waitTime = parseInt(step.value) || 1000;
      await page.waitForTimeout(waitTime);
      result.evidence = `Waited for ${waitTime}ms`;
    } catch (error) {
      throw new Error(`Wait failed: ${error.message}`);
    }
  }

  async performScroll(page, step, result) {
    try {
      if (step.selector) {
        await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) element.scrollIntoView();
        }, step.selector);
        result.evidence = `Scrolled to element: ${step.selector}`;
      } else {
        const scrollAmount = parseInt(step.value) || 0;
        await page.evaluate((amount) => {
          window.scrollBy(0, amount);
        }, scrollAmount);
        result.evidence = `Scrolled by ${scrollAmount}px`;
      }
    } catch (error) {
      throw new Error(`Scroll failed: ${error.message}`);
    }
  }

  async performFormSubmission(page, step, result) {
    try {
      if (step.selector) {
        await page.waitForSelector(step.selector, {
          timeout: step.timeout || 10000,
        });
        await page.click(step.selector);
      } else {
        // Find and submit the first form
        await page.evaluate(() => {
          const form = document.querySelector("form");
          if (form) form.submit();
        });
      }

      await page.waitForTimeout(2000); // Wait for submission
      result.evidence = `Form submitted successfully`;
    } catch (error) {
      throw new Error(`Form submission failed: ${error.message}`);
    }
  }

  async performWaitForElement(page, step, result) {
    try {
      await page.waitForSelector(step.selector, {
        visible: true,
        timeout: step.timeout || 10000,
      });
      result.evidence = `Element appeared: ${step.selector}`;
    } catch (error) {
      throw new Error(`Wait for element failed: ${error.message}`);
    }
  }

  async performScriptExecution(page, step, result) {
    try {
      const scriptResult = await page.evaluate((script) => {
        return eval(script);
      }, step.value);

      result.data = { scriptResult };
      result.evidence = `Script executed successfully`;
    } catch (error) {
      throw new Error(`Script execution failed: ${error.message}`);
    }
  }

  async performVerification(page, step, result) {
    try {
      if (step.selector) {
        const element = await page.$(step.selector);
        if (!element) {
          throw new Error(`Element not found: ${step.selector}`);
        }
        const text = await element.evaluate((el) => el.textContent);
        if (step.value && !text.includes(step.value)) {
          throw new Error(`Expected text "${step.value}" not found in element`);
        }
        result.evidence = `Verification passed for: ${step.selector}`;
      } else {
        // General page verification
        const title = await page.title();
        const url = page.url();
        result.data = { title, url };
        result.evidence = `Page verification completed`;
      }
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  async runAutomation(targetUrl, acceptanceCriteria, websocketCallback = null) {
    await this.initBrowser();
    const page = await this.browser.newPage();

    try {
      // Set viewport and user agent for realistic browsing
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      // Set longer timeouts
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);

      // Listen for console events for debugging
      page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
      page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

      console.log(`🚀 Starting automation for: ${targetUrl}`);

      // Parse acceptance criteria into automation steps
      const automationSteps = await this.parseAutomationCriteria({
        ...acceptanceCriteria,
        targetUrl,
      });

      console.log(`📋 Generated ${automationSteps.length} automation steps`);

      // Execute each automation step
      const stepResults = [];
      for (let i = 0; i < automationSteps.length; i++) {
        const step = automationSteps[i];
        console.log(
          `🔄 Executing step ${i + 1}/${automationSteps.length}: ${
            step.description
          }`
        );

        // Send step progress via websocket if callback provided
        if (websocketCallback) {
          websocketCallback({
            type: "step_start",
            step: i + 1,
            total: automationSteps.length,
            description: step.description,
            category: step.category,
          });
        }

        const result = await this.executeAutomationStep(page, step, i + 1);
        stepResults.push(result);

        // Send step result via websocket
        if (websocketCallback) {
          websocketCallback({
            type: "step_complete",
            step: i + 1,
            result,
          });
        }

        console.log(
          `   ${result.status === "completed" ? "✅" : "❌"} ${
            result.description
          }`
        );

        // Small delay between steps
        await page.waitForTimeout(500);
      }

      // Calculate automation summary
      const completedSteps = stepResults.filter(
        (r) => r.status === "completed"
      ).length;
      const failedSteps = stepResults.filter(
        (r) => r.status === "failed"
      ).length;
      const totalDuration = stepResults.reduce((sum, r) => sum + r.duration, 0);

      // Collect all generated files
      const allFiles = stepResults.reduce((files, result) => {
        return files.concat(result.files || []);
      }, []);

      const summary = {
        totalSteps: automationSteps.length,
        completedSteps,
        failedSteps,
        successRate: Math.round(
          (completedSteps / automationSteps.length) * 100
        ),
        totalDuration,
        stepResults,
        generatedFiles: allFiles,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `✅ Automation completed. Success rate: ${summary.successRate}%`
      );
      return summary;
    } catch (error) {
      console.error("❌ Automation execution failed:", error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async generateAutomationSummary(automationResults, acceptanceCriteria) {
    try {
      const prompt = `
        Analyze this browser automation execution and provide a comprehensive summary.
        
        Acceptance Criteria:
        ${JSON.stringify(acceptanceCriteria, null, 2)}
        
        Automation Results:
        - Total Steps: ${automationResults.totalSteps}
        - Completed: ${automationResults.completedSteps}
        - Failed: ${automationResults.failedSteps}
        - Success Rate: ${automationResults.successRate}%
        - Duration: ${automationResults.totalDuration}ms
        
        Step Details:
        ${automationResults.stepResults
          .map(
            (step) =>
              `- ${step.description}: ${step.status} (${step.duration}ms) ${
                step.error ? `- Error: ${step.error}` : ""
              }`
          )
          .join("\n")}
        
        Generated Files: ${automationResults.generatedFiles.length}
        
        Please provide a structured analysis including:
        1. What automation tasks were successfully completed
        2. What data was extracted and files generated
        3. Any failed steps and recommendations for improvement
        4. Overall automation effectiveness
        5. Suggestions for optimizing the automation workflow
        
        Keep the response professional and actionable for automation engineers.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a browser automation expert analyzing automation execution results.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("❌ AI summary generation failed:", error);
      return "AI analysis unavailable. Please review the automation results manually.";
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PuppeteerAutomationService;
