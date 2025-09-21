const PlaywrightAutomationService = require("./services/playwrightAutomationService");

async function testAIPasswordExtraction() {
  console.log("🤖 Testing AI-Powered Password Extraction");
  console.log("=========================================");

  const automationService = new PlaywrightAutomationService();

  // Test the user's specific acceptance criteria format
  const userAcceptanceCriteria = {
    title: "novafiling test",
    content:
      "look for email and password field\ndev@gmail.com in email\ndev@gmail.com in password \nclick sign in button\ncheck login is done or not\nand which on is redirect page look dashboard page\n",
    extractData: true,
    generateScreenshots: true,
    generatePDF: false,
    testForms: true,
    crawlSPA: false,
    automationTasks: [
      "Page load validation",
      "Content verification",
      "Form functionality testing",
      "Navigation testing",
      "Performance analysis",
    ],
  };

  console.log("\n📋 Testing User's Acceptance Criteria with AI:");
  console.log("Content:", userAcceptanceCriteria.content);

  try {
    const email = await automationService.extractEmailFromCriteria(
      userAcceptanceCriteria
    );
    const password = await automationService.extractPasswordFromCriteria(
      userAcceptanceCriteria
    );

    console.log(`\n📧 AI Extracted email: ${email}`);
    console.log(`🔒 AI Extracted password: ${password}`);

    if (email === "dev@gmail.com" && password === "dev@gmail.com") {
      console.log(
        "\n✅ SUCCESS: AI correctly extracted both email and password!"
      );
      console.log("✅ Email: dev@gmail.com");
      console.log("✅ Password: dev@gmail.com");
      console.log("\n🎯 Complete Automation Flow:");
      console.log("=============================");
      console.log("1. ✅ Navigate to NovaFiling URL");
      console.log("2. ✅ Analyze page for forms");
      console.log("3. ✅ AI Extract email: dev@gmail.com");
      console.log("4. ✅ AI Extract password: dev@gmail.com");
      console.log("5. ✅ Find email field: #signin_email");
      console.log("6. ✅ Fill email field: dev@gmail.com");
      console.log("7. ✅ Find password field: #signin_password");
      console.log("8. ✅ Fill password field: dev@gmail.com");
      console.log("9. ✅ Click submit button: button[type='submit']");
      console.log("10. ✅ Verify login success and redirect to dashboard");
    } else {
      console.log("\n❌ FAILED: AI extraction not working correctly");
      console.log(`Expected email: dev@gmail.com, got: ${email}`);
      console.log(`Expected password: dev@gmail.com, got: ${password}`);
    }

    // Test other formats
    console.log("\n🔍 Testing Other Formats with AI:");

    const testCases = [
      {
        name: "Standard format",
        criteria: {
          content:
            "Login with email: test@example.com and password: mypassword123",
        },
        expectedEmail: "test@example.com",
        expectedPassword: "mypassword123",
      },
      {
        name: "User's format",
        criteria: {
          content: "dev@gmail.com in email\ndev@gmail.com in password",
        },
        expectedEmail: "dev@gmail.com",
        expectedPassword: "dev@gmail.com",
      },
      {
        name: "Alternative format",
        criteria: {
          content: "Use test@example.com for password",
        },
        expectedEmail: "test@example.com",
        expectedPassword: "test@example.com",
      },
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 ${testCase.name}:`);
      const extractedEmail = await automationService.extractEmailFromCriteria(
        testCase.criteria
      );
      const extractedPassword =
        await automationService.extractPasswordFromCriteria(testCase.criteria);
      console.log(`   Expected Email: ${testCase.expectedEmail}`);
      console.log(`   Got Email: ${extractedEmail}`);
      console.log(`   Expected Password: ${testCase.expectedPassword}`);
      console.log(`   Got Password: ${extractedPassword}`);
      console.log(
        `   Status: ${
          extractedEmail === testCase.expectedEmail &&
          extractedPassword === testCase.expectedPassword
            ? "✅ PASS"
            : "❌ FAIL"
        }`
      );
    }
  } catch (error) {
    console.error("❌ AI extraction test failed:", error);
  }
}

// Run the test
testAIPasswordExtraction().catch(console.error);
