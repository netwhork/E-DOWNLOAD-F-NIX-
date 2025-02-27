const { chromium } = require("playwright");

async function pref(empresaId) {
  try {
    const browser = await chromium.launch({
      headless: false,
      slowMo: 50,
    });

    const page = await browser.newPage();
    await page.goto("https://www.gp.srv.br/tributario/sinop/portal_login?1");
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");
    await page.fill("#vUSUARIO_LOGIN", "03.300.663/0001-10");
    await page.fill("#vUSUARIO_SENHA", "923m5koq5");
    await page.click("#BTN_ENTER3");
    await page.waitForSelector("#TB_TITULO", { state: "visible" });
    console.log("entrei pref");
    await page.waitForTimeout(1000);
    await page.waitForSelector("#vBTN_FILTRO", { 
        state: "visible",
        timeout: 30000 
    });
    try {
        await page.click("#vBTN_FILTRO");
    } catch (error) {
        console.log("Regular click failed, trying evaluate");
        await page.evaluate(() => {
            document.querySelector("#vBTN_FILTRO").click();
        });
    }
    await page.fill("#vFILTRO_CONTRIBUINTE_PESSOA_CPF_CNPJ", empresaId);
    await page.click("#BTN_CONSULTAR");
    await page.waitForSelector(".Form.gx-masked", { state: "visible" });
    await page.waitForSelector(".Form.gx-masked", { state: "hidden" });

    try {
        const elemento = await Promise.race([
            page.waitForSelector("#vSELECIONE_0001", { state: "visible" }),
            page.waitForSelector("#gxp0_b", { state: "visible" })
        ]);
        if (await elemento.getAttribute('id') === 'vSELECIONE_0001') {
            await page.click("#vSELECIONE_0001");
        } else {
            console.log("Empresa não existe");
           // await page.reload();
        }
    } catch (error) {
        console.error("Erro ao aguardar elementos:", error);
        throw error;
    }

    await page.waitForSelector("#IMG_NFSE", { state: "visible" });
    await page.goto("https://www.gp.srv.br/tributario/sinop/mnfse_livro_prestador");
    await page.waitForSelector("#GROUP11", { state: "visible" });
    console.log("Busca PRESTADOS");
    
    await page.selectOption('vEXERCICIO_MES_C', '2');
    await page.selectOption('vEXERCICIO_ANO_C', '2025');

} catch (error) {
    console.error("Ocorreu um erro:", error);
    // throw error;
}
}
// await browser.close();

module.exports = { pref };  // Exportando a função