// import puppeteer from "puppeteer";
// import dotenv from "dotenv";
// import fs from "fs";
const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();

/**
 * Получает остаток интернета пользователя на основе предоставленных учетных данных.
 *
 * @param {string} phoneArg - Номер телефона пользователя в формате 9998887766.
 * @param {string} passwordArg - Пароль пользователя для доступа к учетной записи.
 * @returns {Promise<string>} - Возвращает остаток интернета пользователя в виде строки.
 */

const COOKIES_PATH = "./cookies.json";

async function checkAuth(page, phone, password) {
    try {
        await page.waitForSelector(
            ".dashboard-balance-t2__container .tele2-ui-kit__h3:first-child"
        );
    } catch (error) {
        await login(page, phone, password);
    }
}

async function login(page, phone, password) {
    const passwordBtn = await page.$('[value="PASSWORD"]');
    if (!passwordBtn) throw new Error("Кнопка 'PASSWORD' не найдена.");
    await passwordBtn.click();

    await page.waitForSelector("#phoneNumber1");
    const numberInputs = await page.$$(
        "#phoneNumber1, #phoneNumber2, #phoneNumber3, #phoneNumber4, #phoneNumber5, #phoneNumber6, #phoneNumber7, #phoneNumber8, #phoneNumber9, #phoneNumber10"
    );

    if (numberInputs.length !== phone.length)
        throw new Error("Количество полей для ввода номера не совпадает с длиной номера.");
    for (let i = 0; i < phone.length; i++) {
        await numberInputs[i].type(phone[i]);
    }

    await page.waitForSelector('input[type="password"]');
    const passwordInput = await page.$('input[type="password"]');
    if (!passwordInput) throw new Error("Поле для ввода пароля не найдено.");
    await passwordInput.type(password);
    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error("Кнопка 'Submit' не найдена.");
    await submitBtn.click();

    await page.waitForNavigation();
    await page.waitForSelector(
        ".dashboard-tariff-remains__amount-container .tele2-ui-kit__h4:first-child"
    );
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies));
}

(async () => {
    const phone = process.env.PHONE;
    const password = process.env.PASSWORD;

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
        });

        const page = await browser.newPage();
        if (fs.existsSync(COOKIES_PATH)) {
            const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
            await page.setCookie(...cookies);
        }
        await page.goto("https://msk.t2.ru/lk");

        await checkAuth(page, phone, password);
        const trafficEl = await page.$(
            ".dashboard-tariff-remains__amount-container .tele2-ui-kit__h4:first-child"
        );
        if (!trafficEl) throw new Error("Элемент с остатком интернета не найден.");

        const balance = await page.evaluate((el) => el.textContent, trafficEl);

        console.log(`Остаток интернета: ${balance}`);
        return `Остаток интернета: ${balance}`;
    } catch (error) {
        console.error("Произошла ошибка:", error.message);
    } finally {
        await browser.close();
    }
})();
