const Devise = (() => {
  const CLE_STOCKAGE = "budget_devise";
  const DEFAUT = "EUR";

  const LISTE = [
    { code: "EUR", symbole: "€", libelle: "Euro (€)" },
    { code: "GBP", symbole: "£", libelle: "Livre Sterling (£)" },
  ];

  let codeEnCache = null;

  function obtenirCode() {
    if (codeEnCache !== null) return codeEnCache;

    let stocke;
    try {
      stocke = localStorage.getItem(CLE_STOCKAGE);
    } catch (erreur) {
      console.error("Impossible de lire la devise depuis localStorage.", erreur);
      codeEnCache = DEFAUT;
      return codeEnCache;
    }

    codeEnCache = LISTE.some((d) => d.code === stocke) ? stocke : DEFAUT;
    return codeEnCache;
  }

  function invaliderCache() {
    codeEnCache = null;
  }

  function obtenirDevise() {
    return LISTE.find((d) => d.code === obtenirCode()) || LISTE[0];
  }

  function obtenirSymbole() {
    return obtenirDevise().symbole;
  }

  function definir(code) {
    if (!LISTE.some((d) => d.code === code)) return false;
    try {
      localStorage.setItem(CLE_STOCKAGE, code);
      codeEnCache = code;
      return true;
    } catch (erreur) {
      console.error("Impossible d'enregistrer la devise.", erreur);
      return false;
    }
  }

  function peuplerSelect(select) {
    select.innerHTML = "";
    LISTE.forEach(({ code, libelle }) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = libelle;
      select.appendChild(option);
    });
    select.value = obtenirCode();
  }

  return { CLE_STOCKAGE, LISTE, obtenirCode, obtenirSymbole, definir, peuplerSelect, invaliderCache };
})();
