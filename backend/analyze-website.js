const PlaywrightAutomationService = require("./services/playwrightAutomationService");

async function analyzeWebsite(url) {
  const automation = new PlaywrightAutomationService();

  try {
    console.log(`🔍 Analyzing website: ${url}`);

    // Initialize browser
    await automation.initBrowser("chromium", false, true);

    // Navigate to the URL
    console.log("🌐 Navigating to the page...");
    await automation.page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for page to load
    await automation.page.waitForTimeout(3000);

    // Analyze the page for login elements
    const analysis = await automation.analyzePageForLogin();

    console.log("\n📊 Analysis Results:");
    console.log(`📋 Forms found: ${analysis.forms}`);
    console.log(`🔍 Input fields: ${analysis.inputs}`);
    console.log(`🔘 Buttons: ${analysis.buttons}`);
    console.log(`📸 Screenshot: ${analysis.screenshot}`);

    if (analysis.emailField) {
      console.log(`\n✅ Email Field Found:`);
      console.log(`   Selector: ${analysis.emailField.selector}`);
      console.log(`   Type: ${analysis.emailField.type}`);
      console.log(`   Name: ${analysis.emailField.name || "none"}`);
      console.log(`   ID: ${analysis.emailField.id || "none"}`);
      console.log(
        `   Placeholder: ${analysis.emailField.placeholder || "none"}`
      );
    } else {
      console.log(`\n❌ No email field found`);
    }

    if (analysis.passwordField) {
      console.log(`\n✅ Password Field Found:`);
      console.log(`   Selector: ${analysis.passwordField.selector}`);
      console.log(`   Type: ${analysis.passwordField.type}`);
      console.log(`   Name: ${analysis.passwordField.name || "none"}`);
      console.log(`   ID: ${analysis.passwordField.id || "none"}`);
      console.log(
        `   Placeholder: ${analysis.passwordField.placeholder || "none"}`
      );
    } else {
      console.log(`\n❌ No password field found`);
    }

    if (analysis.submitButton) {
      console.log(`\n✅ Submit Button Found:`);
      console.log(`   Selector: ${analysis.submitButton.selector}`);
      console.log(`   Type: ${analysis.submitButton.type}`);
      console.log(`   Text: ${analysis.submitButton.text || "none"}`);
      console.log(`   ID: ${analysis.submitButton.id || "none"}`);
    } else {
      console.log(`\n❌ No submit button found`);
    }

    if (analysis.form) {
      console.log(`\n✅ Login Form Found:`);
      console.log(`   Selector: ${analysis.form.selector}`);
      console.log(`   ID: ${analysis.form.id || "none"}`);
      console.log(`   Class: ${analysis.form.class || "none"}`);
      console.log(`   Action: ${analysis.form.action || "none"}`);
      console.log(`   Input Count: ${analysis.form.inputCount}`);
    } else {
      console.log(`\n❌ No login form found`);
    }

    // Check if we can perform login
    const canLogin =
      analysis.emailField && analysis.passwordField && analysis.submitButton;
    console.log(`\n🎯 Can perform login: ${canLogin ? "YES" : "NO"}`);

    if (canLogin) {
      console.log("\n💡 This website can be automated for login!");
      console.log(
        "   Run: node test-intelligent-login.js " +
          url +
          " your-email your-password"
      );
    } else {
      console.log("\n⚠️  This website may not be suitable for automated login");
      console.log("   Missing required elements for login automation");
    }

    return analysis;
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    return null;
  } finally {
    await automation.cleanup();
  }
}

// Get URL from command line
const url = process.argv[2];

if (!url) {
  console.log("Usage: node analyze-website.js <URL>");
  console.log("Example: node analyze-website.js https://example.com/login");
  process.exit(1);
}

analyzeWebsite(url);
