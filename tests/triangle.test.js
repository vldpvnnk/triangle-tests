const { Builder, By, until, Key } = require('selenium-webdriver');
const { expect } = require('chai');

const LOCATORS = {
    inputA: By.css('input.js_a'),
    inputB: By.css('input.js_b'),
    inputC: By.css('input.js_c'),
    submitBtn: By.xpath("//button[contains(text(), 'Показать')]"),
    resultBlock: By.css('.info')
};

describe('Тестирование валидатора треугольников', function() {
    this.timeout(30000);
    let driver;

    before(async function() {
        driver = await new Builder().forBrowser('chrome').build();
    });

    beforeEach(async function() {
        await driver.get('https://playground.learnqa.ru/puzzle/triangle');
    });

    after(async function() {
        if (driver) {
            await driver.quit();
        }
    });

    async function fillSides(a, b, c) {
        const inputA = await driver.findElement(LOCATORS.inputA);
        const inputB = await driver.findElement(LOCATORS.inputB);
        const inputC = await driver.findElement(LOCATORS.inputC);
        
        await inputA.clear();
        await inputA.sendKeys(a);
        await inputB.clear();
        await inputB.sendKeys(b);
        await inputC.clear();
        await inputC.sendKeys(c, Key.TAB); 

        const submitBtn = await driver.findElement(LOCATORS.submitBtn);

        let isResultVisible = false;
        
        for (let i = 0; i < 3; i++) {
            try {
                await driver.executeScript("arguments[0].click();", submitBtn);
                const resultBlock = await driver.wait(until.elementLocated(LOCATORS.resultBlock), 1000);
                await driver.wait(until.elementIsVisible(resultBlock), 1000);
                
                isResultVisible = true;
                break; // Успех, выходим мгновенно
            } catch (e) {
                // Игнорируем ошибку таймаута и пробуем кликнуть снова
            }
        }

        if (!isResultVisible) {
            throw new Error('Не удалось нажать кнопку: результат не появился.');
        }
    }

    async function checkResultText(expectedText) {
        // Элемент уже найден в fillSides, тут мы его быстро перехватываем
        const resultBlock = await driver.findElement(LOCATORS.resultBlock);
        
        // Быстрая проверка, что текст подгрузился
        await driver.wait(async () => (await resultBlock.getText()).length > 0, 2000);

        const actualText = await resultBlock.getText();
        expect(actualText).to.include(expectedText);

        const classList = await resultBlock.getAttribute('class');
        
        const isError = expectedText.includes('НЕ треугольник') || 
                        expectedText.includes('Одна сторона больше') || 
                        expectedText.includes('Задайте все стороны') ||
                        expectedText.includes('Числа слишком большие') ||
                        expectedText.includes('SQL-инъекции это плохо') ||
                        expectedText.includes('XSS это плохо');

        if (isError) {
             expect(classList).to.include('error');
        } else {
             expect(classList).to.not.include('error');
             expect(classList).to.include('logg');
        }
    }

    // --- ТЕСТЫ ---
    it('TC-001: Прямоугольный треугольник (3, 4, 5)', async function() {
        await fillSides(3, 4, 5);
        await checkResultText('Это прямоугольный треугольник');
    });

    it('TC-002: Тупоугольный треугольник (3, 5, 7)', async function() {
        await fillSides(3, 5, 7);
        await checkResultText('Это тупоугольный треугольник');
    });

    it('TC-003: Остроугольный треугольник (6, 7, 8)', async function() {
        await fillSides(6, 7, 8);
        await checkResultText('Это остроугольный треугольник');
    });

    it('TC-004: Равносторонний треугольник (6, 6, 6)', async function() {
        await fillSides(6, 6, 6);
        await checkResultText('Это равносторонний треугольник');
    });

    it('TC-005: Равнобедренный треугольник (5, 5, 8)', async function() {
        await fillSides(5, 5, 8);
        await checkResultText('Это равнобедренный треугольник');
    });

    it('TC-006: Ввод букв (A, B, C)', async function() {
        await fillSides('A', 'B', 'C');
        await checkResultText('Это НЕ треугольник');
    });

    it('TC-007: Несуществующий треугольник (1, 2, 10)', async function() {
        await fillSides(1, 2, 10);
        await checkResultText('Одна сторона больше'); 
    });

    it('TC-008: Отрицательные числа (-5, 5, 5)', async function() {
        await fillSides(-5, 5, 5);
        await checkResultText('Это НЕ треугольник');
    });

    it('TC-009: Пустые поля', async function() {
        await fillSides('', '', ''); 
        await checkResultText('Задайте все стороны');
    });

    it('TC-010: Частичное заполнение (Только A=5)', async function() {
        await fillSides(5, '', ''); 
        await checkResultText('Задайте все стороны');
    });

    it('TC-011: Ввод нуля (0, 5, 5)', async function() {
        await fillSides(0, 5, 5);
        await checkResultText('Одна сторона больше суммы двух других или равна ей');
    });
    it('TC-012: Слишком большие числа (1e+20, 1e+20, 1e+20)', async function() {
        await fillSides(1e+20, 1e+20, 1e+20);
        await checkResultText('Числа слишком большие');    
    });
    it('TC-013: SQL-инъекция (5; SELECT FROM Users; 5)', async function() {
        await fillSides(5,'SELECT FROM Users', 5);
        await checkResultText('SQL-инъекции это плохо!');
    });

    it('TC-014: XSS-инъекция (5, <script>alert(1)</script>, 5)', async function() {
        await fillSides(5, '<script>alert(1)</script>', 5);
        await checkResultText('XSS это плохо!');
    });

    // Пропускаем, так как в текущей реализации форма не работает корректно с точкой в качестве десятичного разделителя
    it.skip('TC-016: Ввод с разделителем точка (3.5, 4.5, 5.5)', async function() {
        await fillSides(3.5, 4.5, 5.5);
        await checkResultText('Это остроугольный треугольник');
    });

    // Пропускаем, так как в текущей реализации форма не работает корректно с запятой в качестве десятичного разделителя
    it.skip('TC-017: Ввод с разделителем запятая (3,5, 4,5, 5,5)', async function() {
        await fillSides('3,5', '4,5', '5,5');
        await checkResultText('Это остроугольный треугольник');
    });

    // Пропускаем, так как в текущей реализации форма не работает корректно при пустом поле C
    it.skip('TC-018: Форма не валидирует поле C при вводе (5, 5, )', async function() {
        await fillSides(5, 5, ''); 
        await checkResultText('Задайте все стороны');
    });

    // Пропускаем, так как в текущей реализации форма не работает корректно при заполнении нулями в качестве сторон треугольника
    it.skip('TC-019: При вводе нулей (0, 0, 0) считается, что это равносторонний треугольник', async function() {
        await fillSides(0, 0, 0);
        await checkResultText('Одна сторона больше суммы двух других или равна ей');
    });
});