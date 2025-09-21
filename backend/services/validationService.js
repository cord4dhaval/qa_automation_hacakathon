const puppeteer = require("puppeteer");
const OpenAI = require("openai");
const FunctionalTestService = require("./functionalTestService");
const PuppeteerAutomationService = require("./puppeteerAutomationService");
const PlaywrightAutomationService = require("./playwrightAutomationService");
require("dotenv").config();

class ValidationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.browser = null;
    this.functionalTestService = new FunctionalTestService();
    this.automationService = new PuppeteerAutomationService();
    this.playwrightAutomationService = new PlaywrightAutomationService();
    this.initBrowser();
  }

  async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS === "true",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
      });
      console.log("✅ Puppeteer browser initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Puppeteer browser:", error);
      throw error;
    }
  }

  async scrapePage(url) {
    if (!this.browser) {
      await this.initBrowser();
    }

    const page = await this.browser.newPage();

    try {
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      // Navigate to the page
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
      });

      // Extract page data
      const pageData = await page.evaluate(() => {
        const getElementText = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        };

        const getMetaContent = (name) => {
          const meta = document.querySelector(`meta[name="${name}"]`);
          return meta ? meta.getAttribute("content") : null;
        };

        const getImages = () => {
          const images = Array.from(document.querySelectorAll("img"));
          return images.map((img) => ({
            src: img.src,
            alt: img.alt,
            width: img.width,
            height: img.height,
          }));
        };

        const getLinks = () => {
          const links = Array.from(document.querySelectorAll("a[href]"));
          return links.map((link) => ({
            href: link.href,
            text: link.textContent.trim(),
            title: link.title,
          }));
        };

        const getForms = () => {
          const forms = Array.from(document.querySelectorAll("form"));
          return forms.map((form) => ({
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
              label: input.labels?.[0]?.textContent.trim() || null,
            })),
          }));
        };

        const getHeadings = () => {
          const headings = {};
          for (let i = 1; i <= 6; i++) {
            const elements = Array.from(document.querySelectorAll(`h${i}`));
            headings[`h${i}`] = elements.map((h) => h.textContent.trim());
          }
          return headings;
        };

        return {
          title: document.title,
          h1: getElementText("h1"),
          metaDescription: getMetaContent("description"),
          metaKeywords: getMetaContent("keywords"),
          metaViewport: getMetaContent("viewport"),
          images: getImages(),
          links: getLinks(),
          forms: getForms(),
          headings: getHeadings(),
          htmlSize: document.documentElement.outerHTML.length,
          scriptCount: document.querySelectorAll("script").length,
          styleCount: document.querySelectorAll('style, link[rel="stylesheet"]')
            .length,
          bodyText: document.body.textContent.trim(),
          url: window.location.href,
          timestamp: new Date().toISOString(),
        };
      });

      return pageData;
    } catch (error) {
      console.error("❌ Page scraping failed:", error);
      throw new Error(`Failed to scrape page: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async validatePage(pageData, acceptanceCriteria) {
    const validationResults = {
      contentChecks: this.validateContent(pageData, acceptanceCriteria),
      seoChecks: this.validateSEO(pageData),
      accessibilityChecks: this.validateAccessibility(pageData),
      performanceChecks: this.validatePerformance(pageData),
      linkChecks: this.validateLinks(pageData),
      formChecks: this.validateForms(pageData),
    };

    // Calculate overall score
    const score = this.calculateScore(validationResults);

    // Determine verdict
    const verdict = this.determineVerdict(score, validationResults);

    return {
      score,
      verdict,
      validationResults,
      pageData,
      timestamp: new Date().toISOString(),
    };
  }

  async runFunctionalTests(targetUrl, acceptanceCriteria) {
    try {
      console.log(`🚀 Starting functional tests for: ${targetUrl}`);
      const functionalTestResults =
        await this.functionalTestService.runFunctionalTests(
          targetUrl,
          acceptanceCriteria
        );

      console.log(
        `✅ Functional tests completed. Success rate: ${functionalTestResults.successRate}%`
      );
      return functionalTestResults;
    } catch (error) {
      console.error("❌ Functional tests failed:", error);
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0,
        totalDuration: 0,
        testResults: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runPlaywrightAutomation(
    targetUrl,
    acceptanceCriteria,
    websocketCallback = null,
    headless = false,
    connectToExisting = true
  ) {
    try {
      console.log(
        `🎭 Starting simplified Playwright automation for: ${targetUrl}`
      );
      console.log(`🌐 Browser mode: ${headless ? "headless" : "visible"}`);

      const automationResults =
        await this.playwrightAutomationService.runAutomation(
          targetUrl,
          acceptanceCriteria,
          websocketCallback,
          headless,
          connectToExisting
        );

      console.log(
        `✅ Playwright automation completed. Success rate: ${automationResults.successRate}%`
      );
      return automationResults;
    } catch (error) {
      console.error("❌ Playwright automation failed:", error);

      // Return a more detailed error response
      return {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        successRate: 0,
        totalDuration: 0,
        stepResults: [
          {
            step: "Automation failed",
            action: "error",
            status: "failed",
            error: error.message,
            duration: 0,
            timestamp: new Date().toISOString(),
          },
        ],
        generatedFiles: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async runComprehensiveAutomation(
    targetUrl,
    acceptanceCriteria,
    websocketCallback = null
  ) {
    try {
      console.log(`🚀 Starting comprehensive automation for: ${targetUrl}`);

      // Run Playwright automation with visible browser
      const playwrightResults = await this.runPlaywrightAutomation(
        targetUrl,
        acceptanceCriteria,
        websocketCallback,
        false, // headless = false for visible browser
        true // connectToExisting = true to use existing browser window
      );

      console.log(`✅ Comprehensive automation completed`);
      return playwrightResults;
    } catch (error) {
      console.error("❌ Comprehensive automation failed:", error);
      return {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        successRate: 0,
        totalDuration: 0,
        stepResults: [
          {
            step: "Comprehensive automation failed",
            action: "error",
            status: "failed",
            error: error.message,
            duration: 0,
            timestamp: new Date().toISOString(),
          },
        ],
        generatedFiles: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  validateContent(pageData, acceptanceCriteria) {
    const checks = [];

    // Check if title matches criteria
    if (acceptanceCriteria.title) {
      const titleMatch = pageData.title
        .toLowerCase()
        .includes(acceptanceCriteria.title.toLowerCase());
      checks.push({
        type: "title_match",
        description: "Page title matches acceptance criteria",
        passed: titleMatch,
        evidence: titleMatch
          ? `Title: "${pageData.title}"`
          : `Expected: "${acceptanceCriteria.title}", Found: "${pageData.title}"`,
        priority: "high",
      });
    }

    // Check if H1 matches criteria
    if (acceptanceCriteria.h1) {
      const h1Match =
        pageData.h1 &&
        pageData.h1.toLowerCase().includes(acceptanceCriteria.h1.toLowerCase());
      checks.push({
        type: "h1_match",
        description: "H1 heading matches acceptance criteria",
        passed: h1Match,
        evidence: h1Match
          ? `H1: "${pageData.h1}"`
          : `Expected: "${acceptanceCriteria.h1}", Found: "${
              pageData.h1 || "None"
            }"`,
        priority: "high",
      });
    }

    // Check if body content contains required text
    if (acceptanceCriteria.content) {
      const contentMatch = pageData.bodyText
        .toLowerCase()
        .includes(acceptanceCriteria.content.toLowerCase());
      checks.push({
        type: "content_match",
        description: "Page content contains required text",
        passed: contentMatch,
        evidence: contentMatch
          ? "Required content found in page body"
          : "Required content not found in page body",
        priority: "medium",
      });
    }

    return checks;
  }

  validateSEO(pageData) {
    const checks = [];

    // Title length check
    const titleLength = pageData.title.length;
    const titleLengthOK = titleLength >= 30 && titleLength <= 60;
    checks.push({
      type: "title_length",
      description: "Page title length is optimal (30-60 characters)",
      passed: titleLengthOK,
      evidence: `Title length: ${titleLength} characters`,
      priority: "medium",
    });

    // Meta description check
    const hasMetaDescription = !!pageData.metaDescription;
    const metaDescLength = pageData.metaDescription
      ? pageData.metaDescription.length
      : 0;
    const metaDescLengthOK = metaDescLength >= 120 && metaDescLength <= 160;

    checks.push({
      type: "meta_description",
      description:
        "Meta description exists and has optimal length (120-160 characters)",
      passed: hasMetaDescription && metaDescLengthOK,
      evidence: hasMetaDescription
        ? `Meta description length: ${metaDescLength} characters`
        : "No meta description found",
      priority: "medium",
    });

    // H1 presence check
    const hasH1 = !!pageData.h1;
    checks.push({
      type: "h1_presence",
      description: "Page has exactly one H1 heading",
      passed: hasH1,
      evidence: hasH1 ? `H1: "${pageData.h1}"` : "No H1 heading found",
      priority: "high",
    });

    return checks;
  }

  validateAccessibility(pageData) {
    const checks = [];

    // Image alt text check
    const imagesWithoutAlt = pageData.images.filter(
      (img) => !img.alt || img.alt.trim() === ""
    );
    const altTextOK = imagesWithoutAlt.length === 0;
    checks.push({
      type: "image_alt_text",
      description: "All images have alt text for accessibility",
      passed: altTextOK,
      evidence: altTextOK
        ? `All ${pageData.images.length} images have alt text`
        : `${imagesWithoutAlt.length} images missing alt text`,
      priority: "high",
    });

    // Form labels check
    const formsWithoutLabels = pageData.forms.flatMap((form) =>
      form.inputs.filter((input) => !input.label && !input.placeholder)
    );
    const formLabelsOK = formsWithoutLabels.length === 0;
    checks.push({
      type: "form_labels",
      description: "All form inputs have labels or placeholders",
      passed: formLabelsOK,
      evidence: formLabelsOK
        ? "All form inputs have labels or placeholders"
        : `${formsWithoutLabels.length} form inputs missing labels/placeholders`,
      priority: "medium",
    });

    // Heading structure check
    const headings = pageData.headings;
    const hasProperStructure = headings.h1 && headings.h1.length === 1;
    checks.push({
      type: "heading_structure",
      description: "Page has proper heading hierarchy (one H1)",
      passed: hasProperStructure,
      evidence: hasProperStructure
        ? "Proper heading hierarchy found"
        : "Improper heading hierarchy",
      priority: "medium",
    });

    return checks;
  }

  validatePerformance(pageData) {
    const checks = [];

    // HTML size check
    const htmlSizeOK = pageData.htmlSize < 500000; // 500KB limit
    checks.push({
      type: "html_size",
      description: "HTML size is reasonable (< 500KB)",
      passed: htmlSizeOK,
      evidence: `HTML size: ${(pageData.htmlSize / 1024).toFixed(2)} KB`,
      priority: "low",
    });

    // Script count check
    const scriptCountOK = pageData.scriptCount < 20;
    checks.push({
      type: "script_count",
      description: "Reasonable number of scripts (< 20)",
      passed: scriptCountOK,
      evidence: `Script count: ${pageData.scriptCount}`,
      priority: "low",
    });

    // Style count check
    const styleCountOK = pageData.styleCount < 10;
    checks.push({
      type: "style_count",
      description: "Reasonable number of stylesheets (< 10)",
      passed: styleCountOK,
      evidence: `Stylesheet count: ${pageData.styleCount}`,
      priority: "low",
    });

    return checks;
  }

  validateLinks(pageData) {
    const checks = [];

    // Internal links check
    const currentDomain = new URL(pageData.url).hostname;
    const internalLinks = pageData.links.filter((link) => {
      try {
        const linkDomain = new URL(link.href).hostname;
        return linkDomain === currentDomain;
      } catch {
        return false;
      }
    });

    const hasInternalLinks = internalLinks.length > 0;
    checks.push({
      type: "internal_links",
      description: "Page has internal navigation links",
      passed: hasInternalLinks,
      evidence: hasInternalLinks
        ? `${internalLinks.length} internal links found`
        : "No internal links found",
      priority: "medium",
    });

    // Broken links check (basic)
    const validLinks = pageData.links.filter((link) => {
      try {
        new URL(link.href);
        return true;
      } catch {
        return false;
      }
    });

    const linkValidityOK = validLinks.length === pageData.links.length;
    checks.push({
      type: "link_validity",
      description: "All links have valid URLs",
      passed: linkValidityOK,
      evidence: linkValidityOK
        ? `All ${pageData.links.length} links have valid URLs`
        : `${
            pageData.links.length - validLinks.length
          } links have invalid URLs`,
      priority: "low",
    });

    return checks;
  }

  validateForms(pageData) {
    const checks = [];

    // Form accessibility check
    const formsWithRequired = pageData.forms.filter((form) =>
      form.inputs.some((input) => input.required)
    );

    const requiredInputsOK = formsWithRequired.every((form) =>
      form.inputs.every((input) =>
        input.required ? input.label || input.placeholder : true
      )
    );

    checks.push({
      type: "required_inputs",
      description: "Required form inputs have proper labels/placeholders",
      passed: requiredInputsOK,
      evidence: requiredInputsOK
        ? "All required inputs have proper labels/placeholders"
        : "Some required inputs missing labels/placeholders",
      priority: "high",
    });

    return checks;
  }

  calculateScore(validationResults) {
    let totalScore = 100;
    let totalChecks = 0;
    let failedChecks = 0;

    // Flatten all checks
    const allChecks = [
      ...validationResults.contentChecks,
      ...validationResults.seoChecks,
      ...validationResults.accessibilityChecks,
      ...validationResults.performanceChecks,
      ...validationResults.linkChecks,
      ...validationResults.formChecks,
    ];

    totalChecks = allChecks.length;

    // Calculate deductions based on priority and failed checks
    allChecks.forEach((check) => {
      if (!check.passed) {
        failedChecks++;
        switch (check.priority) {
          case "critical":
            totalScore -= 20;
            break;
          case "high":
            totalScore -= 15;
            break;
          case "medium":
            totalScore -= 10;
            break;
          case "low":
            totalScore -= 5;
            break;
        }
      }
    });

    // Ensure score doesn't go below 0
    totalScore = Math.max(0, totalScore);

    // Bonus for perfect score
    if (failedChecks === 0) {
      totalScore = Math.min(100, totalScore + 5);
    }

    return Math.round(totalScore);
  }

  determineVerdict(score, validationResults) {
    // Check for critical failures first
    const allChecks = [
      ...validationResults.contentChecks,
      ...validationResults.seoChecks,
      ...validationResults.accessibilityChecks,
      ...validationResults.performanceChecks,
      ...validationResults.linkChecks,
      ...validationResults.formChecks,
    ];

    const hasCriticalFailures = allChecks.some(
      (check) => !check.passed && check.priority === "critical"
    );

    const hasMajorFailures = allChecks.some(
      (check) => !check.passed && check.priority === "high"
    );

    if (hasCriticalFailures || score < 70) {
      return "Fail";
    } else if (hasMajorFailures || score < 90) {
      return "Partial";
    } else {
      return "Pass";
    }
  }

  async generateAISummary(
    validationResults,
    pageData,
    acceptanceCriteria,
    functionalTestResults = null,
    automationResults = null
  ) {
    try {
      let functionalTestSection = "";
      if (functionalTestResults) {
        functionalTestSection = `
        
        Functional Test Results:
        - Total Tests: ${functionalTestResults.totalTests}
        - Passed: ${functionalTestResults.passedTests}
        - Failed: ${functionalTestResults.failedTests}
        - Success Rate: ${functionalTestResults.successRate}%
        - Test Duration: ${functionalTestResults.totalDuration}ms
        
        Test Steps:
        ${functionalTestResults.testResults
          .map(
            (test) =>
              `- ${test.step}: ${
                test.status === "passed" ? "✅ PASS" : "❌ FAIL"
              } (${test.duration}ms)`
          )
          .join("\n")}
        `;
      }

      let automationSection = "";
      if (automationResults) {
        automationSection = `
        
        Simplified Playwright Automation Results:
        - Total Steps: ${automationResults.totalSteps}
        - Completed: ${automationResults.completedSteps}
        - Failed: ${automationResults.failedSteps}
        - Success Rate: ${automationResults.successRate}%
        - Total Duration: ${automationResults.totalDuration}ms
        
        Automation Steps:
        ${automationResults.stepResults
          .map(
            (step) =>
              `- ${step.step}: ${
                step.status === "passed" ? "✅ PASS" : "❌ FAIL"
              } (${step.duration}ms)${
                step.error ? ` - Error: ${step.error}` : ""
              }`
          )
          .join("\n")}
        
        Page Analysis:
        - Forms Found: ${automationResults.pageAnalysis?.forms || 0}
        - Input Fields: ${automationResults.pageAnalysis?.inputs || 0}
        - Buttons: ${automationResults.pageAnalysis?.buttons || 0}
        - Has Email Field: ${
          automationResults.pageAnalysis?.hasEmailField ? "Yes" : "No"
        }
        - Has Password Field: ${
          automationResults.pageAnalysis?.hasPasswordField ? "Yes" : "No"
        }
        - Has Submit Button: ${
          automationResults.pageAnalysis?.hasSubmitButton ? "Yes" : "No"
        }
        `;
      }

      const prompt = `
        Analyze this web page validation against the acceptance criteria and provide a professional summary.
        
        Acceptance Criteria:
        ${JSON.stringify(acceptanceCriteria, null, 2)}
        
        Validation Results:
        ${JSON.stringify(validationResults, null, 2)}
        
        Page Data Summary:
        - Title: ${pageData.title}
        - H1: ${pageData.h1}
        - Meta Description: ${pageData.metaDescription}
        - Images: ${pageData.images.length}
        - Links: ${pageData.links.length}
        - Forms: ${pageData.forms.length}
        ${functionalTestSection}
        ${automationSection}
        
        Please provide a structured analysis including:
        1. What's working well
        2. What's missing or needs improvement
        3. Specific recommendations for manual testing
        4. Overall implementation quality assessment
        ${
          functionalTestResults
            ? "5. Functional test analysis and user interaction assessment"
            : ""
        }
        ${
          automationResults
            ? "6. Browser automation analysis and visual testing insights"
            : ""
        }
        
        Keep the response professional and actionable for QA testers.
        ${
          functionalTestResults || automationResults
            ? "Focus on both static validation and functional behavior."
            : ""
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a senior QA engineer analyzing web page validation results. Provide clear, actionable insights.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("❌ AI summary generation failed:", error);
      return "AI analysis unavailable. Please review the validation results manually.";
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.automationService) {
      await this.automationService.cleanup();
    }
    if (this.playwrightAutomationService) {
      await this.playwrightAutomationService.cleanup();
    }
    if (this.functionalTestService) {
      await this.functionalTestService.cleanup();
    }
  }
}

module.exports = ValidationService;
