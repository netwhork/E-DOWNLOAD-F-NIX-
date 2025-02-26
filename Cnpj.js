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
    await page.click("#vBTN_FILTRO");
    await page.fill("#vFILTRO_CONTRIBUINTE_PESSOA_CPF_CNPJ", empresaId); // Usando o ID da empresa
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
            await page.reload();
        }
    } catch (error) {
        console.error("Erro ao aguardar elementos:", error);
        throw error;
    }

    await page.waitForSelector("#IMG_NFSE", { state: "visible" });
    await page.goto("https://www.gp.srv.br/tributario/sinop/portal_login?1");
    await browser.close();

  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
}
//ESTE SERÁ O CÓDIGO ONDE BUSCA OS CNPJS PELA PREFEITURA
module.exports = { pref };  // Exportando a função