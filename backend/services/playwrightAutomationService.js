const { chromium, firefox, webkit } = require("playwright");
const OpenAI = require("openai");
const { spawn, exec } = require("child_process");
const { promisify } = require("util");
require("dotenv").config();

const execAsync = promisify(exec);

class PlaywrightAutomationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initBrowser(
    browserType = "chromium",
    headless = false,
    connectToExisting = true
  ) {
    try {
      if (connectToExisting) {
        // Try to connect to existing browser first
        try {
          await this.connectToExistingBrowser();
          console.log(`✅ Connected to existing browser instance`);
          return;
        } catch (error) {
          console.log(
            `⚠️ Could not connect to existing browser, launching new one: ${error.message}`
          );
        }
      }

      // Fallback to launching new browser
      const browserEngine =
        browserType === "firefox"
          ? firefox
          : browserType === "webkit"
          ? webkit
          : chromium;

      this.browser = await browserEngine.launch({
        headless: headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--start-maximized",
          "--disable-blink-features=AutomationControlled",
          "--remote-debugging-port=9222", // Enable CDP for future connections
        ],
        timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT) || 60000,
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        ignoreHTTPSErrors: true,
      });

      this.page = await this.context.newPage();

      // Set longer timeouts
      this.page.setDefaultTimeout(120000); // 2 minutes
      this.page.setDefaultNavigationTimeout(120000); // 2 minutes

      console.log(`✅ Playwright ${browserType} browser initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize Playwright browser:`, error);
      throw error;
    }
  }

  async ensureChromeWithDebugging() {
    try {
      // Check if Chrome is already running with debugging port
      const cdpEndpoint = "http://localhost:9222";
      const response = await fetch(`${cdpEndpoint}/json`);

      if (response.ok) {
        console.log("✅ Chrome is already running with debugging enabled");
        return true;
      }
    } catch (error) {
      console.log("Chrome not running with debugging, will start it...");
    }

    try {
      // Try to start Chrome with debugging enabled
      const chromeArgs = [
        "--remote-debugging-port=9222",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-default-apps",
        "--disable-popup-blocking",
        "--disable-extensions",
        "--disable-translate",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--user-data-dir=/tmp/chrome-debug-profile",
      ];

      // Try different Chrome executable paths
      const chromePaths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
        "/usr/bin/google-chrome", // Linux
        "/usr/bin/chromium-browser", // Linux Chromium
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", // Windows 32-bit
      ];

      let chromeStarted = false;
      for (const chromePath of chromePaths) {
        try {
          console.log(`Trying to start Chrome at: ${chromePath}`);
          const chromeProcess = spawn(chromePath, chromeArgs, {
            detached: true,
            stdio: "ignore",
          });

          chromeProcess.unref();

          // Wait a bit for Chrome to start
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // Check if Chrome is now accessible
          const testResponse = await fetch("http://localhost:9222/json");
          if (testResponse.ok) {
            console.log(`✅ Chrome started successfully at: ${chromePath}`);
            chromeStarted = true;
            break;
          }
        } catch (error) {
          console.log(
            `Failed to start Chrome at ${chromePath}: ${error.message}`
          );
          continue;
        }
      }

      if (!chromeStarted) {
        throw new Error("Could not start Chrome with debugging enabled");
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to ensure Chrome with debugging:", error);
      throw error;
    }
  }

  async connectToExistingBrowser() {
    try {
      // Ensure Chrome is running with debugging enabled
      await this.ensureChromeWithDebugging();

      // Try to connect to existing Chrome/Chromium instance via CDP
      const cdpEndpoint = "http://localhost:9222";

      // Connect to the existing browser
      this.browser = await chromium.connectOverCDP(cdpEndpoint);

      // Get existing contexts
      const contexts = this.browser.contexts();

      if (contexts.length > 0) {
        // Use existing context
        this.context = contexts[0];
      } else {
        // Create new context
        this.context = await this.browser.newContext({
          viewport: { width: 1920, height: 1080 },
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          ignoreHTTPSErrors: true,
        });
      }

      // Create a new page/tab for automation
      this.page = await this.context.newPage();

      // Set longer timeouts
      this.page.setDefaultTimeout(120000); // 2 minutes
      this.page.setDefaultNavigationTimeout(120000); // 2 minutes

      console.log(`✅ Connected to existing browser and created new tab`);
    } catch (error) {
      console.error(`❌ Failed to connect to existing browser:`, error);
      throw error;
    }
  }

  async parseAcceptanceCriteria(acceptanceCriteria) {
    try {
      console.log("🔍 Parsing acceptance criteria...");

      // Extract text content from acceptance criteria
      let criteriaText = "";
      if (typeof acceptanceCriteria === "string") {
        criteriaText = acceptanceCriteria;
      } else if (acceptanceCriteria && typeof acceptanceCriteria === "object") {
        if (acceptanceCriteria.content) {
          criteriaText = acceptanceCriteria.content;
        } else if (acceptanceCriteria.title) {
          criteriaText = acceptanceCriteria.title;
        } else {
          criteriaText = JSON.stringify(acceptanceCriteria);
        }
      } else {
        criteriaText = String(acceptanceCriteria);
      }

      console.log("📝 Extracted criteria text:", criteriaText);

      // Extract credentials from criteria
      const email = await this.extractEmailFromCriteria(acceptanceCriteria);
      const password = await this.extractPasswordFromCriteria(
        acceptanceCriteria
      );

      console.log("📧 Extracted email:", email);
      console.log("🔒 Extracted password:", password);

      // Generate focused automation steps
      const steps = [];

      // Step 1: Navigate to URL
      steps.push({
        step: "Navigate to target URL",
        action: "navigate",
        selector: "",
        value: "",
        timeout: 30000,
        priority: "high",
        waitFor: "domcontentloaded",
      });

      // Step 2: Wait for page to load
      steps.push({
        step: "Wait for page to load completely",
        action: "wait",
        selector: "",
        value: "3000",
        timeout: 10000,
        priority: "high",
        waitFor: "load",
      });

      // Step 3: Take initial screenshot
      steps.push({
        step: "Take initial page screenshot",
        action: "screenshot",
        selector: "",
        value: "initial_page",
        timeout: 5000,
        priority: "medium",
        waitFor: "element",
      });

      // If we have login credentials, add login steps
      if (email && password) {
        console.log("🔐 Adding login automation steps...");

        steps.push({
          step: "Find and fill email field",
          action: "type",
          selector:
            "#signin_email, input[id='signin_email'], input[type='email'], input[name*='email'], input[id*='email'], input[placeholder*='email'], input[type='text']:first-of-type",
          value: email,
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        });

        steps.push({
          step: "Find and fill password field",
          action: "type",
          selector:
            "#signin_password, input[id='signin_password'], input[type='password'], input[name*='password'], input[id*='password']",
          value: password,
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        });

        steps.push({
          step: "Click submit/login button",
          action: "click",
          selector:
            "button[type='submit'], button:has-text('Login'), input[type='submit'], button:has-text('Sign In'), button:has-text('Log In'), button:has-text('Submit')",
          value: "",
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        });

        steps.push({
          step: "Wait for login to complete",
          action: "wait",
          selector: "",
          value: "5000",
          timeout: 20000,
          priority: "high",
          waitFor: "load",
        });

        steps.push({
          step: "Take post-login screenshot",
          action: "screenshot",
          selector: "",
          value: "after_login",
          timeout: 5000,
          priority: "medium",
          waitFor: "element",
        });

        steps.push({
          step: "Verify login success",
          action: "verify",
          selector: "",
          value: "login successful - URL changed or dashboard visible",
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        });
      }

      // Add final verification step
      steps.push({
        step: "Take final screenshot",
        action: "screenshot",
        selector: "",
        value: "final_page",
        timeout: 5000,
        priority: "medium",
        waitFor: "element",
      });

      console.log("✅ Generated", steps.length, "automation steps");
      return steps;
    } catch (error) {
      console.error("❌ Failed to parse acceptance criteria:", error);
      return this.generateFallbackSteps(acceptanceCriteria);
    }
  }

  generateFallbackSteps(acceptanceCriteria) {
    const steps = [];
    console.log("🔄 Generating fallback steps...");

    // Extract text content from acceptance criteria
    let criteriaText = "";
    if (typeof acceptanceCriteria === "string") {
      criteriaText = acceptanceCriteria;
    } else if (acceptanceCriteria && typeof acceptanceCriteria === "object") {
      if (acceptanceCriteria.content) {
        criteriaText = acceptanceCriteria.content;
      } else if (acceptanceCriteria.title) {
        criteriaText = acceptanceCriteria.title;
      } else {
        criteriaText = JSON.stringify(acceptanceCriteria);
      }
    } else {
      criteriaText = String(acceptanceCriteria);
    }

    console.log("📝 Fallback criteria text:", criteriaText);

    // Extract email and password from criteria text
    const emailMatch = criteriaText.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    const passwordMatch = criteriaText.match(/password[:\s]*([^\n\r]+)/i);

    const email = emailMatch ? emailMatch[1] : "test@example.com";
    const password = passwordMatch ? passwordMatch[1].trim() : "password123";

    console.log("📧 Extracted email:", email);
    console.log("🔒 Extracted password:", password);

    // Basic navigation step
    steps.push({
      step: "Navigate to the target URL",
      action: "navigate",
      selector: "",
      value: "",
      timeout: 30000,
      priority: "high",
      waitFor: "domcontentloaded",
    });

    // Enhanced login detection and steps
    const criteria = criteriaText.toLowerCase();
    if (
      criteria.includes("login") ||
      criteria.includes("email") ||
      criteria.includes("password") ||
      criteria.includes("sign in") ||
      criteria.includes("sign-in")
    ) {
      console.log("🔐 Login flow detected, adding login steps...");

      steps.push(
        {
          step: "Wait for login form to be visible",
          action: "wait",
          selector: "login-form-detection",
          value: "5000",
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        },
        {
          step: "Type email/username",
          action: "type",
          selector:
            "input[type='email'], input[type='text'], input[name*='email'], input[name*='username'], input[id*='email'], input[placeholder*='email'], #signin_email",
          value: email,
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        },
        {
          step: "Type password",
          action: "type",
          selector:
            "input[type='password'], input[name*='password'], input[id*='password'], input[placeholder*='password'], #signin_password",
          value: password,
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        },
        {
          step: "Click sign in button",
          action: "click",
          selector:
            "button[type='submit'], input[type='submit'], button:has-text('Sign In'), button:has-text('Login'), button:has-text('sign in'), button:has-text('login'), button:has-text('Login')",
          value: "",
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        },
        {
          step: "Wait for login to complete",
          action: "wait",
          selector: "",
          value: "5000",
          timeout: 20000,
          priority: "high",
          waitFor: "load",
        },
        {
          step: "Verify login success by checking URL change",
          action: "verify",
          selector: "",
          value: "login successful - URL changed or dashboard visible",
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        },
        {
          step: "Check for dashboard or success page",
          action: "verify",
          selector:
            ".dashboard, .home, .welcome, .profile, [data-test='dashboard'], .main-content, .user-dashboard",
          value: "dashboard page visible",
          timeout: 15000,
          priority: "high",
          waitFor: "element",
        }
      );
    }

    console.log("✅ Generated", steps.length, "fallback steps");
    return steps;
  }

  async executeStep(step, targetUrl = null) {
    console.log(`🔍 Executing step: ${step.step}`);
    console.log(`📋 Step details:`, JSON.stringify(step, null, 2));

    const result = {
      step: step.step,
      action: step.action,
      status: "pending",
      evidence: "",
      error: null,
      duration: 0,
      screenshot: null,
      timestamp: new Date().toISOString(),
      debugInfo: {
        selector: step.selector,
        value: step.value,
        timeout: step.timeout,
        waitFor: step.waitFor,
      },
    };

    const startTime = Date.now();

    try {
      console.log(`🎯 Action: ${step.action}`);
      console.log(`🎯 Selector: ${step.selector}`);
      console.log(`🎯 Value: ${step.value}`);
      console.log(`🎯 Timeout: ${step.timeout}`);

      switch (step.action) {
        case "navigate":
          console.log(`🌐 Navigating to: ${targetUrl}`);
          await this.performNavigation(step, targetUrl);
          result.status = "passed";
          result.evidence = `Successfully navigated to: ${targetUrl}`;
          console.log(`✅ Navigation successful`);
          break;

        case "click":
          console.log(`🖱️ Clicking element: ${step.selector}`);
          await this.performClick(step);
          result.status = "passed";
          result.evidence = `Successfully clicked element: ${step.selector}`;
          console.log(`✅ Click successful`);
          break;

        case "type":
          console.log(`⌨️ Typing "${step.value}" into: ${step.selector}`);
          await this.performType(step);
          result.status = "passed";
          result.evidence = `Successfully typed: ${step.value}`;
          console.log(`✅ Type successful`);
          break;

        case "wait":
          console.log(`⏳ Waiting: ${step.value}ms`);
          await this.performWait(step);
          result.status = "passed";
          result.evidence = `Wait completed: ${step.value}ms`;
          console.log(`✅ Wait completed`);
          break;

        case "verify":
          console.log(`🔍 Verifying: ${step.value}`);
          await this.performVerification(step);
          result.status = "passed";
          result.evidence = `Verification passed: ${step.value}`;
          console.log(`✅ Verification successful`);
          break;

        case "screenshot":
          console.log(`📸 Taking screenshot`);
          result.screenshot = await this.takeScreenshot(step);
          result.status = "passed";
          result.evidence = `Screenshot captured`;
          console.log(`✅ Screenshot captured: ${result.screenshot}`);
          break;

        default:
          console.log(`❌ Unknown action: ${step.action}`);
          throw new Error(`Unknown action: ${step.action}`);
      }
    } catch (error) {
      console.error(`❌ Step failed: ${step.step}`);
      console.error(`❌ Error: ${error.message}`);
      console.error(`❌ Stack: ${error.stack}`);

      result.status = "failed";
      result.error = error.message;
      result.evidence = `Step failed: ${error.message}`;
      result.debugInfo.errorStack = error.stack;

      // Take screenshot on failure
      try {
        console.log(`📸 Taking error screenshot...`);
        result.screenshot = await this.takeScreenshot({
          step: `Failed: ${step.step}`,
        });
        console.log(`📸 Error screenshot saved: ${result.screenshot}`);
      } catch (screenshotError) {
        console.error("❌ Failed to take error screenshot:", screenshotError);
        result.debugInfo.screenshotError = screenshotError.message;
      }

      // Additional debugging for specific errors
      if (error.message.includes("waitForSelector")) {
        console.log(`🔍 Selector timeout debugging for: ${step.selector}`);
        try {
          const elementCount = await this.page.locator(step.selector).count();
          console.log(`🔍 Elements found with selector: ${elementCount}`);

          if (elementCount === 0) {
            console.log(`🔍 Trying to find similar elements...`);
            const allInputs = await this.page.locator("input").count();
            const allButtons = await this.page.locator("button").count();
            console.log(`🔍 Total inputs on page: ${allInputs}`);
            console.log(`🔍 Total buttons on page: ${allButtons}`);
          }
        } catch (debugError) {
          console.error("❌ Debug error:", debugError.message);
        }
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`⏱️ Step completed in ${result.duration}ms`);
    console.log(`📊 Step result:`, JSON.stringify(result, null, 2));

    return result;
  }

  async performNavigation(step, targetUrl) {
    if (!targetUrl) {
      throw new Error("No target URL provided for navigation");
    }

    const waitUntil = step.waitFor || "domcontentloaded";
    await this.page.goto(targetUrl, {
      waitUntil,
      timeout: step.timeout || 120000, // 2 minutes
    });

    // Additional wait for dynamic content
    await this.page.waitForTimeout(2000);
  }

  async performClick(step) {
    console.log(`🖱️ Attempting to click using selector: ${step.selector}`);

    // Try multiple selector strategies for better reliability
    const selectors = step.selector.split(", ");
    let elementFound = false;
    let lastError = null;

    for (const selector of selectors) {
      try {
        console.log(`🔍 Trying click selector: ${selector}`);

        // Wait for element to be visible
        await this.page.waitForSelector(selector.trim(), {
          timeout: 5000, // Shorter timeout per selector
          state: "visible",
        });

        // Try normal click first
        await this.page.click(selector.trim());
        console.log(`✅ Successfully clicked using selector: ${selector}`);
        elementFound = true;
        break;
      } catch (error) {
        lastError = error;
        console.log(`❌ Click selector "${selector}" failed: ${error.message}`);

        // Try force click as backup
        try {
          await this.page.click(selector.trim(), { force: true });
          console.log(
            `✅ Successfully force-clicked using selector: ${selector}`
          );
          elementFound = true;
          break;
        } catch (forceError) {
          console.log(
            `❌ Force click also failed for "${selector}": ${forceError.message}`
          );
          continue;
        }
      }
    }

    if (!elementFound) {
      throw new Error(
        `Failed to click element. Tried selectors: ${step.selector}. Last error: ${lastError?.message}`
      );
    }

    // Wait for any animations or redirects
    await this.page.waitForTimeout(2000);
  }

  async performType(step) {
    console.log(
      `⌨️ Attempting to type "${step.value}" using selector: ${step.selector}`
    );

    // Try multiple selector strategies for better reliability
    const selectors = step.selector.split(", ");
    let elementFound = false;
    let lastError = null;

    for (const selector of selectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);

        // Wait for element to be visible
        await this.page.waitForSelector(selector.trim(), {
          timeout: 5000, // Shorter timeout per selector
          state: "visible",
        });

        // Method 1: Try fill method first (most reliable)
        try {
          await this.page.fill(selector.trim(), step.value);
          const actualValue = await this.page.inputValue(selector.trim());
          if (actualValue === step.value) {
            console.log(
              `✅ Successfully filled "${step.value}" using selector: ${selector}`
            );
            elementFound = true;
            break;
          }
        } catch (fillError) {
          console.log(`⚠️ Fill method failed: ${fillError.message}`);
        }

        // Method 2: Try click + keyboard approach
        try {
          await this.page.click(selector.trim());
          await this.page.waitForTimeout(200); // Small delay

          // Clear existing content using keyboard shortcuts
          await this.page.keyboard.press("Control+a"); // Select all
          await this.page.keyboard.press("Delete"); // Delete selected content
          await this.page.waitForTimeout(100);

          // Type new value
          await this.page.keyboard.type(step.value);
          await this.page.waitForTimeout(200);

          // Verify the value was entered correctly
          const actualValue = await this.page.inputValue(selector.trim());
          if (actualValue === step.value) {
            console.log(
              `✅ Successfully typed "${step.value}" using selector: ${selector}`
            );
            elementFound = true;
            break;
          }
        } catch (keyboardError) {
          console.log(`⚠️ Keyboard method failed: ${keyboardError.message}`);
        }

        // Method 3: Try focus + type approach
        try {
          await this.page.focus(selector.trim());
          await this.page.waitForTimeout(200);

          // Clear and type using evaluate
          await this.page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (element) {
              element.value = "";
              element.focus();
            }
          }, selector.trim());

          await this.page.keyboard.type(step.value);
          await this.page.waitForTimeout(200);

          const actualValue = await this.page.inputValue(selector.trim());
          if (actualValue === step.value) {
            console.log(
              `✅ Successfully typed "${step.value}" using focus method: ${selector}`
            );
            elementFound = true;
            break;
          }
        } catch (focusError) {
          console.log(`⚠️ Focus method failed: ${focusError.message}`);
        }
      } catch (error) {
        lastError = error;
        console.log(`❌ Selector "${selector}" failed: ${error.message}`);
        continue;
      }
    }

    if (!elementFound) {
      throw new Error(
        `Failed to find or fill input field. Tried selectors: ${step.selector}. Last error: ${lastError?.message}`
      );
    }

    // Small delay to ensure value is processed
    await this.page.waitForTimeout(500);
  }

  async performWait(step) {
    if (step.waitFor === "element" && step.selector) {
      // Wait for specific element
      await this.page.waitForSelector(step.selector, {
        timeout: step.timeout || 10000,
      });
    } else {
      // Wait for specified time
      const waitTime = parseInt(step.value) || 1000;
      console.log(`⏳ Waiting for ${waitTime}ms`);
      await this.page.waitForTimeout(waitTime);
    }
  }

  async performVerification(step) {
    console.log(`🔍 Verifying: ${step.value}`);

    if (
      step.value.includes("login successful") ||
      step.value.includes("success")
    ) {
      // Check if we're no longer on login page
      const currentUrl = this.page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      // More flexible URL checking - allow for partial matches
      const isStillOnLoginPage =
        currentUrl.includes("sign-in") ||
        currentUrl.includes("login") ||
        currentUrl.includes("auth") ||
        currentUrl.includes("signin");

      if (isStillOnLoginPage) {
        console.log("⚠️ Still on login page, checking for error messages...");

        // Check for error messages that might indicate login failure
        const errorSelectors = [
          ".error",
          ".alert",
          ".warning",
          ".danger",
          "[class*='error']",
          "[class*='alert']",
          "[class*='warning']",
          ".ant-message-error",
          ".ant-notification-error",
          ".login-error",
          ".auth-error",
          ".signin-error",
        ];

        let hasError = false;
        for (const selector of errorSelectors) {
          try {
            const count = await this.page.locator(selector).count();
            if (count > 0) {
              const errorText = await this.page
                .locator(selector)
                .first()
                .textContent();
              console.log(`❌ Found error message: ${errorText}`);
              hasError = true;
              break;
            }
          } catch (error) {
            // Continue to next selector
            continue;
          }
        }

        if (hasError) {
          throw new Error(
            "Login verification failed - error message found on page"
          );
        }

        // If no error messages, check if form is still visible (might be loading)
        const formVisible = (await this.page.locator("form").count()) > 0;
        if (formVisible) {
          console.log("⚠️ Login form still visible, might be loading...");
          // Wait a bit more and check again
          await this.page.waitForTimeout(2000);
          const newUrl = this.page.url();
          if (newUrl !== currentUrl) {
            console.log(`✅ URL changed during wait: ${newUrl}`);
            return; // Success - URL changed
          }
        }

        throw new Error(
          "Login verification failed - still on login page after checks"
        );
      }

      console.log(
        "✅ No longer on login page, checking for success indicators..."
      );

      // Check for success indicators
      const successSelectors = [
        ".dashboard",
        ".home",
        ".welcome",
        ".profile",
        "[data-test='dashboard']",
        ".main-content",
        ".user-dashboard",
        ".account",
        ".user-menu",
        ".nav-user",
        ".user-info",
        ".app-content",
        ".main-container",
        ".content-area",
        "[class*='dashboard']",
        "[class*='home']",
        "[class*='welcome']",
      ];

      let successFound = false;
      for (const selector of successSelectors) {
        try {
          const count = await this.page.locator(selector).count();
          if (count > 0) {
            console.log(`✅ Found success indicator: ${selector}`);
            successFound = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
          continue;
        }
      }

      if (!successFound) {
        // Additional check: look for success text
        const pageText = await this.page.textContent("body");
        const successKeywords = [
          "dashboard",
          "welcome",
          "account",
          "profile",
          "logout",
          "settings",
          "home",
          "main",
          "overview",
          "summary",
          "reports",
          "analytics",
        ];
        const hasSuccessText = successKeywords.some((keyword) =>
          pageText.toLowerCase().includes(keyword)
        );

        if (!hasSuccessText) {
          // Last resort: if URL changed significantly, consider it success
          if (
            currentUrl.length > 0 &&
            !currentUrl.includes("sign-in") &&
            !currentUrl.includes("login")
          ) {
            console.log(
              "✅ URL changed significantly, considering login successful"
            );
            return;
          }
          throw new Error(
            "Login verification failed - no success indicators found"
          );
        } else {
          console.log("✅ Found success text indicators");
        }
      }
    } else {
      // General page verification
      const title = await this.page.title();
      if (!title || title === "") {
        throw new Error("Page verification failed - no title found");
      }
      console.log(`✅ Page title found: ${title}`);
    }
  }

  async takeScreenshot(step) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `screenshot_${timestamp}.png`;
    const screenshotPath = `/Users/apple/Dhaval_react/hackathon/qa_automation/backend/screenshots/${filename}`;

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return screenshotPath;
  }

  async scrapePageForForms() {
    try {
      console.log("🔍 Scraping page for form elements...");

      // Get detailed page info with debugging
      const pageInfo = await this.page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll("form"));
        const inputs = Array.from(document.querySelectorAll("input"));
        const buttons = Array.from(
          document.querySelectorAll(
            "button, input[type='submit'], input[type='button']"
          )
        );

        // Detailed input analysis
        const inputDetails = inputs.map((input) => ({
          type: input.type,
          id: input.id,
          name: input.name,
          placeholder: input.placeholder,
          className: input.className,
          value: input.value,
        }));

        // Find specific fields
        const emailFields = inputs.filter(
          (input) =>
            input.type === "email" ||
            input.name?.toLowerCase().includes("email") ||
            input.id?.toLowerCase().includes("email") ||
            input.placeholder?.toLowerCase().includes("email")
        );

        const passwordFields = inputs.filter(
          (input) =>
            input.type === "password" ||
            input.name?.toLowerCase().includes("password") ||
            input.id?.toLowerCase().includes("password") ||
            input.placeholder?.toLowerCase().includes("password")
        );

        const submitButtons = buttons.filter(
          (button) =>
            button.type === "submit" ||
            button.textContent?.toLowerCase().includes("sign in") ||
            button.textContent?.toLowerCase().includes("login") ||
            button.textContent?.toLowerCase().includes("submit")
        );

        return {
          forms: forms.length,
          inputs: inputs.length,
          buttons: buttons.length,
          hasEmailField: emailFields.length > 0,
          hasPasswordField: passwordFields.length > 0,
          hasSubmitButton: submitButtons.length > 0,
          emailFields: emailFields.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            placeholder: field.placeholder,
          })),
          passwordFields: passwordFields.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            placeholder: field.placeholder,
          })),
          submitButtons: submitButtons.map((button) => ({
            type: button.type,
            text: button.textContent?.trim(),
            id: button.id,
            className: button.className,
          })),
          allInputs: inputDetails,
        };
      });

      console.log("📊 Page analysis:", pageInfo);

      // Log detailed field information
      if (pageInfo.emailFields.length > 0) {
        console.log("📧 Email fields found:");
        pageInfo.emailFields.forEach((field, index) => {
          console.log(
            `   ${index + 1}. ID: ${field.id}, Name: ${field.name}, Type: ${
              field.type
            }, Placeholder: ${field.placeholder}`
          );
        });
      } else {
        console.log("❌ No email fields found");
      }

      if (pageInfo.passwordFields.length > 0) {
        console.log("🔒 Password fields found:");
        pageInfo.passwordFields.forEach((field, index) => {
          console.log(
            `   ${index + 1}. ID: ${field.id}, Name: ${field.name}, Type: ${
              field.type
            }, Placeholder: ${field.placeholder}`
          );
        });
      } else {
        console.log("❌ No password fields found");
      }

      if (pageInfo.submitButtons.length > 0) {
        console.log("🔘 Submit buttons found:");
        pageInfo.submitButtons.forEach((button, index) => {
          console.log(
            `   ${index + 1}. Type: ${button.type}, Text: ${button.text}, ID: ${
              button.id
            }`
          );
        });
      } else {
        console.log("❌ No submit buttons found");
      }

      // Log all inputs for debugging
      console.log("🔍 All inputs on page:");
      pageInfo.allInputs.forEach((input, index) => {
        console.log(
          `   ${index + 1}. Type: ${input.type}, ID: ${input.id}, Name: ${
            input.name
          }, Placeholder: ${input.placeholder}`
        );
      });

      // Take a screenshot for debugging
      const screenshot = await this.takeScreenshot({
        step: "Page form analysis",
      });

      return {
        ...pageInfo,
        screenshot,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Failed to scrape page for forms:", error);
      throw error;
    }
  }

  async runAutomation(
    targetUrl,
    acceptanceCriteria,
    websocketCallback = null,
    headless = false,
    connectToExisting = true
  ) {
    await this.initBrowser("chromium", headless, connectToExisting);

    try {
      console.log(`🤖 Starting Playwright automation for: ${targetUrl}`);

      // First, navigate to the target URL
      console.log(`🌐 Navigating to: ${targetUrl}`);
      await this.page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await this.page.waitForTimeout(3000);

      // Scrape page for form analysis
      console.log(`🔍 Analyzing page for forms...`);
      const pageAnalysis = await this.scrapePageForForms();
      console.log(`📊 Page analysis:`, pageAnalysis);

      // Get HTML content for analysis
      const htmlContent = await this.page.content();
      console.log(`📄 HTML Content Length: ${htmlContent.length} characters`);

      // Parse acceptance criteria into automation steps
      console.log(`📋 Parsing acceptance criteria into automation steps`);
      const automationSteps = await this.parseAcceptanceCriteria(
        acceptanceCriteria
      );
      console.log(`✅ Generated ${automationSteps.length} automation steps`);

      // Execute each automation step
      const stepResults = [];
      for (let i = 0; i < automationSteps.length; i++) {
        const step = automationSteps[i];
        console.log(
          `🔍 Executing step ${i + 1}/${automationSteps.length}: ${step.step}`
        );

        // Send progress update via websocket if callback provided
        if (websocketCallback) {
          websocketCallback({
            type: "automation_progress",
            step: i + 1,
            totalSteps: automationSteps.length,
            currentStep: step.step,
            status: "running",
          });
        }

        const result = await this.executeStep(step, targetUrl);
        stepResults.push(result);

        console.log(
          `   ${result.status === "passed" ? "✅" : "❌"} ${result.step}`
        );

        // Send step result via websocket if callback provided
        if (websocketCallback) {
          websocketCallback({
            type: "step_result",
            step: i + 1,
            totalSteps: automationSteps.length,
            result: result,
          });
        }

        // If step failed and it's high priority, stop execution
        if (result.status === "failed" && step.priority === "high") {
          console.log(`❌ High priority step failed, stopping automation`);
          break;
        }
      }

      // Calculate automation summary
      const completedSteps = stepResults.filter(
        (r) => r.status === "passed"
      ).length;
      const failedSteps = stepResults.filter(
        (r) => r.status === "failed"
      ).length;
      const totalDuration = stepResults.reduce((sum, r) => sum + r.duration, 0);

      const summary = {
        totalSteps: automationSteps.length,
        completedSteps,
        failedSteps,
        successRate: Math.round(
          (completedSteps / automationSteps.length) * 100
        ),
        totalDuration,
        stepResults,
        generatedFiles: stepResults
          .filter((r) => r.screenshot)
          .map((r) => r.screenshot),
        htmlContent: htmlContent.substring(0, 5000), // Include first 5000 chars of HTML
        pageAnalysis: pageAnalysis,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `✅ Playwright automation completed. Success rate: ${summary.successRate}%`
      );

      // Send final result via websocket if callback provided
      if (websocketCallback) {
        websocketCallback({
          type: "automation_complete",
          summary: summary,
        });
      }

      return summary;
    } catch (error) {
      console.error("❌ Playwright automation failed:", error);
      return {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        successRate: 0,
        totalDuration: 0,
        stepResults: [],
        generatedFiles: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } finally {
      await this.cleanup();
    }
  }

  async extractEmailFromCriteria(acceptanceCriteria) {
    console.log("🔍 Extracting email from criteria using AI...");

    // First check if email is directly provided in the object
    if (acceptanceCriteria && typeof acceptanceCriteria === "object") {
      if (acceptanceCriteria.email) {
        console.log("✅ Found email in object:", acceptanceCriteria.email);
        return acceptanceCriteria.email;
      }
    }

    // Extract text content from acceptance criteria
    let criteriaText = "";
    if (typeof acceptanceCriteria === "string") {
      criteriaText = acceptanceCriteria;
    } else if (acceptanceCriteria && typeof acceptanceCriteria === "object") {
      if (acceptanceCriteria.content) {
        criteriaText = acceptanceCriteria.content;
      } else if (acceptanceCriteria.title) {
        criteriaText = acceptanceCriteria.title;
      } else {
        criteriaText = JSON.stringify(acceptanceCriteria);
      }
    } else {
      criteriaText = String(acceptanceCriteria);
    }

    console.log("📝 Criteria text for AI email extraction:", criteriaText);

    try {
      const OpenAI = require("openai");
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `Extract the email address from the following text. Return only the email address, nothing else. If no email is found, return "null".

Text: "${criteriaText}"

Email:`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0,
      });

      const extractedEmail = response.choices[0].message.content.trim();

      if (extractedEmail === "null" || !extractedEmail) {
        console.log("❌ No email found by AI");
        return null;
      }

      console.log("✅ AI extracted email:", extractedEmail);
      return extractedEmail;
    } catch (error) {
      console.log(
        "⚠️ AI extraction failed, falling back to regex:",
        error.message
      );

      // Fallback to regex patterns
      const emailPatterns = [
        /email[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        /username[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        /login[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
      ];

      for (const pattern of emailPatterns) {
        const match = criteriaText.match(pattern);
        if (match) {
          console.log("✅ Found email via regex:", match[1]);
          return match[1];
        }
      }

      console.log("❌ No email found in criteria");
      return null;
    }
  }

  async extractPasswordFromCriteria(acceptanceCriteria) {
    console.log("🔍 Extracting password from criteria using AI...");

    // First check if password is directly provided in the object
    if (acceptanceCriteria && typeof acceptanceCriteria === "object") {
      if (acceptanceCriteria.password) {
        const password = acceptanceCriteria.password;
        // Validate that it's not just common words
        const commonWords = [
          "field",
          "password",
          "pass",
          "pwd",
          "login",
          "user",
          "email",
          "username",
        ];
        if (!commonWords.includes(password.toLowerCase())) {
          console.log("✅ Found password in object:", password);
          return password;
        } else {
          console.log("⚠️ Rejected common word as password:", password);
        }
      }
    }

    // Extract text content from acceptance criteria
    let criteriaText = "";
    if (typeof acceptanceCriteria === "string") {
      criteriaText = acceptanceCriteria;
    } else if (acceptanceCriteria && typeof acceptanceCriteria === "object") {
      if (acceptanceCriteria.content) {
        criteriaText = acceptanceCriteria.content;
      } else if (acceptanceCriteria.title) {
        criteriaText = acceptanceCriteria.title;
      } else {
        criteriaText = JSON.stringify(acceptanceCriteria);
      }
    } else {
      criteriaText = String(acceptanceCriteria);
    }

    console.log("📝 Criteria text for AI password extraction:", criteriaText);

    try {
      const OpenAI = require("openai");
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `Extract the password from the following text. Look for patterns like:
- "email in password" (where email is the password)
- "password: value" 
- "pass: value"
- "dev@gmail.com in password" (password is dev@gmail.com)

Return only the password value, nothing else. If no password is found, return "null".

Text: "${criteriaText}"

Password:`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0,
      });

      const extractedPassword = response.choices[0].message.content.trim();

      if (extractedPassword === "null" || !extractedPassword) {
        console.log("❌ No password found by AI");
        return null;
      }

      // Validate that it's not just common words
      const commonWords = [
        "field",
        "password",
        "pass",
        "pwd",
        "login",
        "user",
        "email",
        "username",
      ];

      if (commonWords.includes(extractedPassword.toLowerCase())) {
        console.log(
          "⚠️ AI found common word instead of password:",
          extractedPassword
        );
        return null;
      }

      console.log("✅ AI extracted password:", extractedPassword);
      return extractedPassword;
    } catch (error) {
      console.log(
        "⚠️ AI extraction failed, falling back to regex:",
        error.message
      );

      // Fallback to regex patterns
      const passwordPatterns = [
        /password[:\s]*["']([^"']+)["']/i,
        /pass[:\s]*["']([^"']+)["']/i,
        /password[:\s]*([a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)/i,
        /pass[:\s]*([a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)/i,
        /pwd[:\s]*["']([^"']+)["']/i,
        /pwd[:\s]*([a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)/i,
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+in\s+password/i,
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+for\s+password/i,
        /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+as\s+password/i,
      ];

      for (const pattern of passwordPatterns) {
        const match = criteriaText.match(pattern);
        if (match) {
          const password = match[1].trim();
          const commonWords = [
            "field",
            "password",
            "pass",
            "pwd",
            "login",
            "user",
            "email",
            "username",
          ];
          if (!commonWords.includes(password.toLowerCase())) {
            console.log("✅ Found password via regex:", password);
            return password;
          } else {
            console.log("⚠️ Found common word instead of password:", password);
          }
        }
      }

      console.log("❌ No password found in criteria");
      return null;
    }
  }

  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        // Only close context if we launched the browser ourselves
        // If we connected to existing browser, don't close the context
        if (
          this.browser &&
          this.browser.isConnected &&
          !this.browser._isConnectedOverCDP
        ) {
          await this.context.close();
        }
        this.context = null;
      }
      if (this.browser) {
        // Only close browser if we launched it ourselves
        // If we connected to existing browser, don't close it
        if (!this.browser._isConnectedOverCDP) {
          await this.browser.close();
        }
        this.browser = null;
      }
      console.log("✅ Playwright cleanup completed");
    } catch (error) {
      console.error("❌ Playwright cleanup failed:", error);
    }
  }
}

module.exports = PlaywrightAutomationService;
