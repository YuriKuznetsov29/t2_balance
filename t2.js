import puppeteer from "puppeteer"
import dotenv from "dotenv"

/**
 * Получает баланс пользователя на основе предоставленных учетных данных.
 *
 * @param {string} phoneArg - Номер телефона пользователя в формате 9998887766.
 * @param {string} passwordArg - Пароль пользователя для доступа к учетной записи.
 * @returns {Promise<string>} - Возвращает баланс пользователя в виде строки.
 */

export async function getBalance(phoneArg, passwordArg) {
    dotenv.config()
    const phone = process.env.PHONE || phoneArg
    const password = process.env.PASSWORD || passwordArg

    let browser
    try {
        browser = await puppeteer.launch({
            headless: true,
        })

        const page = await browser.newPage()
        await page.goto("https://msk.t2.ru/lk")

        const passwordBtn = await page.$('[value="PASSWORD"]')
        if (!passwordBtn) throw new Error("Кнопка 'PASSWORD' не найдена.")
        await passwordBtn.click()

        await page.waitForSelector("#phoneNumber1")
        const numberInputs = await page.$$(
            "#phoneNumber1, #phoneNumber2, #phoneNumber3, #phoneNumber4, #phoneNumber5, #phoneNumber6, #phoneNumber7, #phoneNumber8, #phoneNumber9, #phoneNumber10"
        )
        if (numberInputs.length !== phone.length)
            throw new Error("Количество полей для ввода номера не совпадает с длиной номера.")
        for (let i = 0; i < phone.length; i++) {
            await numberInputs[i].type(phone[i])
        }

        const passwordInput = await page.$('input[type="password"]')
        if (!passwordInput) throw new Error("Поле для ввода пароля не найдено.")
        await passwordInput.type(password)

        const submitBtn = await page.$('button[type="submit"]')
        if (!submitBtn) throw new Error("Кнопка 'Submit' не найдена.")
        await submitBtn.click()

        await page.waitForSelector(".dashboard-balance-t2__container .tele2-ui-kit__h3:first-child")
        const balanceEl = await page.$(
            ".dashboard-balance-t2__container .tele2-ui-kit__h3:first-child"
        )
        if (!balanceEl) throw new Error("Элемент баланса не найден.")

        const balance = await page.evaluate((el) => el.textContent, balanceEl)

        console.log(`Ваш баланс: ${balance}`)
        return `Ваш баланс: ${balance}`
    } catch (error) {
        console.error("Произошла ошибка:", error.message)
    } finally {
        await browser.close()
    }
}
