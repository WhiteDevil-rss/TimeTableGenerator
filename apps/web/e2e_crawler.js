const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
    console.log('Starting E2E Chrome Crawler...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    async function login(email, password, role) {
        console.log(`Logging in as ${role}...`);
        await page.goto('http://localhost:3000/login');
        await page.waitForTimeout(1000);
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000); // wait for redirect and loading
        await page.screenshot({ path: `${role}_dashboard.png`, fullPage: true });
        console.log(`Captured ${role} dashboard.`);
    }

    async function logout() {
        console.log('Logging out...');
        // Looking for a logout button or sign out text. We will try clicking text matching "Log out" or "Sign out"
        try {
            await page.click('text=Log out');
        } catch {
            try {
                await page.click('text=Sign out');
            } catch {
                try {
                    await page.click('button:has-text("Logout")');
                } catch {
                    console.log('Could not find logout button, clearing cookies instead.');
                }
            }
        }
        await context.clearCookies();
        await page.goto('http://localhost:3000/login');
        await page.waitForTimeout(1000);
    }

    // 1. Superadmin Flow
    await login('admin@nepscheduler.com', 'password123', 'superadmin');
    await page.goto('http://localhost:3000/superadmin/users');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'superadmin_users_page.png', fullPage: true });
    await logout();

    // 2. Department Admin Flow
    await login('admin.cs@vnsgu.ac.in', 'password123', 'deptadmin');
    await page.goto('http://localhost:3000/department/timetables');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'deptadmin_timetables_page.png', fullPage: true });

    await page.goto('http://localhost:3000/department/faculty');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'deptadmin_faculty_page.png', fullPage: true });
    await logout();

    // 3. Faculty Flow
    await login('dshah@vnsgu.ac.in', 'password123', 'faculty');
    await page.goto('http://localhost:3000/faculty-panel/schedule');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'faculty_schedule_page.png', fullPage: true });
    await logout();

    await browser.close();
    console.log('Crawler finished capturing screenshots.');
})();
