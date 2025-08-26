const puppeteer = require("puppeteer");
const OpenAI = require("openai");
require("dotenv").config();

class FunctionalTestService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
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
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
          timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 60000, // Increased to 60 seconds
          protocolTimeout: 120000, // 2 minutes for protocol operations
        });
        console.log("✅ Functional test browser initialized");
      } catch (error) {
        console.error(
          "❌ Failed to initialize functional test browser:",
          error
        );
        throw error;
      }
    }
  }

  async parseRequirements(acceptanceCriteria) {
    try {
      const prompt = `
  Parse these acceptance criteria into specific functional test steps.
  Convert natural language requirements into actionable test actions.
  
  Acceptance Criteria:
  ${JSON.stringify(acceptanceCriteria, null, 2)}

  Return a JSON array of test steps with this structure:
  [
    {
      "step": "Step description",
      "action": "click|type|navigate|verify|wait",
      "selector": "CSS selector or text to find",
      "value": "text to type or expected result",
      "timeout": 5000,
      "priority": "high|medium|low"
    }
  ]

  Guidelines:
  - Break down each acceptance criterion into functional steps.
  - Use clear, actionable verbs (click, type, verify, navigate, wait).
  - Include realistic selectors when possible (CSS, IDs, placeholders, or text).
  - For verification steps, describe what is expected on the page (element visible, text present, navigation occurred).
  - Focus on user interactions and functional behavior, not implementation details.
`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a QA automation expert. Parse requirements into specific test steps.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      });

      const response = completion.choices[0].message.content;
      // Extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("Failed to parse AI response");
    } catch (error) {
      console.error("❌ Failed to parse requirements:", error);
      // Fallback to basic test steps
      return this.generateFallbackTests(acceptanceCriteria);
    }
  }

  generateFallbackTests(acceptanceCriteria) {
    const tests = [];

    if (acceptanceCriteria.content) {
      tests.push({
        step: "Verify page contains required content",
        action: "verify",
        selector: "body",
        value: acceptanceCriteria.content,
        timeout: 5000,
        priority: "high",
      });
    }

    if (acceptanceCriteria.title) {
      tests.push({
        step: "Verify page title matches criteria",
        action: "verify",
        selector: "title",
        value: acceptanceCriteria.title,
        timeout: 5000,
        priority: "high",
      });
    }

    // Add common functional tests
    tests.push(
      {
        step: "Check if page loads successfully",
        action: "verify",
        selector: "body",
        value: "page loaded",
        timeout: 10000,
        priority: "high",
      },
      {
        step: "Verify no JavaScript errors",
        action: "verify",
        selector: "console",
        value: "no errors",
        timeout: 5000,
        priority: "medium",
      }
    );

    return tests;
  }

  async executeTestStep(page, testStep) {
    const result = {
      step: testStep.step,
      action: testStep.action,
      status: "pending",
      evidence: "",
      error: null,
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    const startTime = Date.now();

    try {
      switch (testStep.action) {
        case "click":
          await this.performClick(page, testStep);
          result.status = "passed";
          result.evidence = `Successfully clicked element: ${testStep.selector}`;
          break;

        case "type":
          await this.performType(page, testStep);
          result.status = "passed";
          result.evidence = `Successfully typed: ${testStep.value}`;
          break;

        case "navigate":
          await this.performNavigation(page, testStep);
          result.status = "passed";
          result.evidence = `Successfully navigated to: ${testStep.value}`;
          break;

        case "verify":
          await this.performVerification(page, testStep);
          result.status = "passed";
          result.evidence = `Verification passed: ${testStep.value}`;
          break;

        case "wait":
          await this.performWait(page, testStep);
          result.status = "passed";
          result.evidence = `Wait completed: ${testStep.value}ms`;
          break;

        default:
          throw new Error(`Unknown action: ${testStep.action}`);
      }
    } catch (error) {
      result.status = "failed";
      result.error = error.message;
      result.evidence = `Test step failed: ${error.message}`;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  async performClick(page, testStep) {
    try {
      // Try to find element by selector first
      let element = await page.$(testStep.selector);

      if (!element) {
        // Try to find by text content
        element = await page.$(`text=${testStep.selector}`);
      }

      if (!element) {
        // Try to find by partial text
        element = await page.$(`text*=${testStep.selector}`);
      }

      if (!element) {
        // Try to find by button text or input type
        if (
          testStep.selector.includes("button") ||
          testStep.selector.includes("login")
        ) {
          element = await page.$(
            'input[type="submit"], button[type="submit"], #login-button'
          );
        }
      }

      if (!element) {
        throw new Error(`Element not found: ${testStep.selector}`);
      }

      await element.click();
      await page.waitForTimeout(1000); // Wait for any animations/redirects
    } catch (error) {
      throw new Error(`Click failed: ${error.message}`);
    }
  }

  async performType(page, testStep) {
    try {
      let element = await page.$(testStep.selector);

      if (!element) {
        // Try to find by common input selectors
        if (
          testStep.selector.includes("username") ||
          testStep.selector.includes("user") ||
          testStep.selector.includes("email")
        ) {
          element = await page.$(
            'input[type="email"], input[name*="email"], input[placeholder*="email"], #email, #username, input[name*="user"], input[placeholder*="username"]'
          );
        } else if (
          testStep.selector.includes("password") ||
          testStep.selector.includes("pass")
        ) {
          element = await page.$(
            'input[type="password"], input[name*="password"], #password, input[placeholder*="password"]'
          );
        }
      }

      if (!element) {
        throw new Error(`Input element not found: ${testStep.selector}`);
      }

      // Use the correct Puppeteer method to clear and type
      await element.evaluate((el) => (el.value = ""));
      await element.type(testStep.value);

      // Verify the value was entered
      const actualValue = await element.evaluate((el) => el.value);
      if (actualValue !== testStep.value) {
        throw new Error(
          `Failed to enter value. Expected: ${testStep.value}, Got: ${actualValue}`
        );
      }
    } catch (error) {
      throw new Error(`Type failed: ${error.message}`);
    }
  }

  async performNavigation(page, testStep) {
    try {
      if (testStep.value.startsWith("http")) {
        await page.goto(testStep.value, { waitUntil: "networkidle2" });
      } else {
        // Relative navigation
        await page.goto(testStep.value, { waitUntil: "networkidle2" });
      }
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  async performVerification(page, testStep) {
    try {
      if (testStep.selector === "title") {
        const title = await page.title();
        if (!title.toLowerCase().includes(testStep.value.toLowerCase())) {
          throw new Error(
            `Title verification failed. Expected: ${testStep.value}, Got: ${title}`
          );
        }
      } else if (testStep.selector === "body") {
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (!bodyText.toLowerCase().includes(testStep.value.toLowerCase())) {
          throw new Error(
            `Content verification failed. Expected: ${testStep.value}`
          );
        }
      } else if (testStep.selector === "console") {
        // Check for JavaScript errors
        const errors = await page.evaluate(() => {
          return window.consoleErrors || [];
        });
        if (errors.length > 0) {
          throw new Error(`JavaScript errors found: ${errors.join(", ")}`);
        }
      } else if (
        testStep.selector.includes("page render") ||
        testStep.selector.includes("page loads")
      ) {
        // Verify page rendered correctly
        const bodyElement = await page.$("body");
        if (!bodyElement) {
          throw new Error("Page did not render - no body element found");
        }

        const pageTitle = await page.title();
        if (!pageTitle || pageTitle === "") {
          throw new Error(
            "Page title is empty - page may not have loaded properly"
          );
        }
      } else if (
        testStep.selector.includes("login fields visible") ||
        testStep.selector.includes("fields visible")
      ) {
        // Verify login fields are visible
        const usernameField = await page.$(
          'input[type="email"], input[name*="email"], input[placeholder*="email"], #email, #username'
        );
        const passwordField = await page.$(
          'input[type="password"], input[name*="password"], #password'
        );

        if (!usernameField) {
          throw new Error("Username field not found or not visible");
        }
        if (!passwordField) {
          throw new Error("Password field not found or not visible");
        }
      } else if (
        testStep.selector.includes("login success") ||
        testStep.selector.includes("login pass")
      ) {
        // Verify login was successful
        await page.waitForTimeout(3000); // Wait for redirect

        const currentUrl = page.url();
        const pageTitle = await page.title();

        // Check for common success indicators
        const successIndicators = await page.$(
          '.dashboard, .home, .welcome, .profile, [data-test="dashboard"], .success-message'
        );
        const errorIndicators = await page.$(
          '.error, .alert-danger, .login-error, [data-test="error"]'
        );

        if (errorIndicators) {
          const errorText = await errorIndicators.evaluate(
            (el) => el.textContent
          );
          throw new Error(`Login failed with error: ${errorText}`);
        }

        if (!successIndicators && currentUrl.includes("sign-in")) {
          throw new Error("Login verification failed - still on sign-in page");
        }
      } else if (
        testStep.selector.includes("navigation work") ||
        testStep.selector.includes("page after navigation")
      ) {
        // Verify navigation worked
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const pageTitle = await page.title();

        // Check if we're no longer on the login page
        if (currentUrl.includes("sign-in") || currentUrl.includes("login")) {
          throw new Error("Navigation failed - still on login page");
        }

        // Check for dashboard or home page elements
        const dashboardElements = await page.$(
          '.dashboard, .home, .welcome, .profile, [data-test="dashboard"], .main-content'
        );
        if (!dashboardElements) {
          throw new Error(
            "Navigation verification failed - no dashboard elements found"
          );
        }
      } else {
        // Generic element verification
        const element = await page.$(testStep.selector);
        if (!element) {
          throw new Error(
            `Element not found for verification: ${testStep.selector}`
          );
        }
      }
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  async performWait(page, testStep) {
    try {
      const waitTime = parseInt(testStep.value) || 1000;
      await page.waitForTimeout(waitTime);
    } catch (error) {
      throw new Error(`Wait failed: ${error.message}`);
    }
  }

  async runFunctionalTests(targetUrl, acceptanceCriteria) {
    await this.initBrowser();
    const page = await this.browser.newPage();

    try {
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      // Set longer timeouts for page operations
      page.setDefaultTimeout(60000); // 60 seconds
      page.setDefaultNavigationTimeout(60000); // 60 seconds

      // Navigate to the page with better error handling
      console.log(`🌐 Navigating to: ${targetUrl}`);
      try {
        await page.goto(targetUrl, {
          waitUntil: "domcontentloaded", // Changed from networkidle2 for faster loading
          timeout: 60000,
        });

        // Wait a bit more for dynamic content
        await page.waitForTimeout(3000);

        console.log(`✅ Page loaded successfully: ${await page.title()}`);
      } catch (navigationError) {
        console.log(`⚠️ Navigation warning: ${navigationError.message}`);
        // Continue anyway, the page might still be usable
      }

      // Parse requirements into test steps
      console.log(`📋 Parsing acceptance criteria into test steps`);
      const testSteps = await this.parseRequirements(acceptanceCriteria);
      console.log(`✅ Generated ${testSteps.length} test steps`);

      // Execute each test step
      const testResults = [];
      for (let i = 0; i < testSteps.length; i++) {
        const testStep = testSteps[i];
        console.log(
          `🔍 Executing test step ${i + 1}/${testSteps.length}: ${
            testStep.step
          }`
        );

        const result = await this.executeTestStep(page, testStep);
        testResults.push(result);

        console.log(
          `   ${result.status === "passed" ? "✅" : "❌"} ${result.step}`
        );
      }

      // Calculate test summary
      const passedTests = testResults.filter(
        (r) => r.status === "passed"
      ).length;
      const failedTests = testResults.filter(
        (r) => r.status === "failed"
      ).length;
      const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

      const summary = {
        totalTests: testSteps.length,
        passedTests,
        failedTests,
        successRate: Math.round((passedTests / testSteps.length) * 100),
        totalDuration,
        testResults,
        timestamp: new Date().toISOString(),
      };

      return summary;
    } catch (error) {
      console.error("❌ Functional test execution failed:", error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = FunctionalTestService;
