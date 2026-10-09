document.addEventListener("DOMContentLoaded", () => {
  BudgetChart.initChart();

  function render() {
    const liste = Storage.getTransactions();
    const listeFiltree = Transactions.filtrerTransactions(liste, UI.lireFiltres());

    UI.afficherSolde(liste);
    UI.afficherHistorique(listeFiltree, (id) => {
      Storage.deleteTransaction(id);
      render();
    });
    BudgetChart.mettreAJourChart(listeFiltree);
  }

  UI.initFormulaire(render);
  UI.initFiltres(render);
  UI.initGestionCategories();
  UI.initDevise(render);

  window.addEventListener("storage", (event) => {
    if (event.key === Storage.CLE_STOCKAGE || event.key === null) {
      render();
    } else if (event.key === Devise.CLE_STOCKAGE) {
      Devise.invaliderCache();
      UI.actualiserAffichageDevise();
      render();
    }
  });

  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((erreur) => {
      console.error("Échec de l'enregistrement du service worker.", erreur);
    });
  }
});
