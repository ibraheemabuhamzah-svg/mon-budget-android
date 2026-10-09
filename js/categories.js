const Categories = (() => {
  const COULEUR_PAR_DEFAUT = "#9ca3af";
  const CLE_STOCKAGE_PERSONNALISEES = "budget_categories_personnalisees";

  const CATEGORIES_PAR_DEFAUT = [
    { cle: "alimentation", libelle: "Alimentation", couleur: "#f59e0b" },
    { cle: "logement", libelle: "Logement", couleur: "#3b82f6" },
    { cle: "transport", libelle: "Transport", couleur: "#06b6d4" },
    { cle: "loisirs", libelle: "Loisirs", couleur: "#a855f7" },
    { cle: "sante", libelle: "Santé", couleur: "#ef4444" },
    { cle: "autres", libelle: "Autres", couleur: COULEUR_PAR_DEFAUT },
  ];

  function chargerPersonnalisees() {
    let brut;
    try {
      brut = localStorage.getItem(CLE_STOCKAGE_PERSONNALISEES);
    } catch (erreur) {
      console.error("Impossible de lire les catégories personnalisées depuis localStorage.", erreur);
      return [];
    }
    if (!brut) return [];
    try {
      const donnees = JSON.parse(brut);
      return Array.isArray(donnees) ? donnees : [];
    } catch (erreur) {
      console.error("Catégories personnalisées corrompues dans localStorage.", erreur);
      return [];
    }
  }

  function sauvegarderPersonnalisees(liste) {
    try {
      localStorage.setItem(CLE_STOCKAGE_PERSONNALISEES, JSON.stringify(liste));
      return true;
    } catch (erreur) {
      console.error("Impossible d'enregistrer les catégories personnalisées.", erreur);
      return false;
    }
  }

  let personnalisees = chargerPersonnalisees();
  let listeEnCache = null;

  function listeComplete() {
    if (!listeEnCache) {
      listeEnCache = [...CATEGORIES_PAR_DEFAUT, ...personnalisees];
    }
    return listeEnCache;
  }

  function genererCle(libelle) {
    return libelle
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function obtenirLibelle(cle) {
    const categorie = listeComplete().find((c) => c.cle === cle);
    return categorie ? categorie.libelle : cle || "Autres";
  }

  function obtenirCouleur(cle) {
    const categorie = listeComplete().find((c) => c.cle === cle);
    return categorie ? categorie.couleur : COULEUR_PAR_DEFAUT;
  }

  function peuplerSelect(select, { avecOptionToutes = false } = {}) {
    select.innerHTML = "";
    if (avecOptionToutes) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Toutes";
      select.appendChild(option);
    }
    listeComplete().forEach(({ cle, libelle }) => {
      const option = document.createElement("option");
      option.value = cle;
      option.textContent = libelle;
      select.appendChild(option);
    });
  }

  function ajouterCategorie(libelleBrut, couleur) {
    const libelle = (libelleBrut || "").trim();
    if (!libelle) {
      return { succes: false, erreur: "Le nom de la catégorie est obligatoire." };
    }

    const cle = genererCle(libelle);
    if (!cle) {
      return { succes: false, erreur: "Ce nom de catégorie n'est pas valide." };
    }

    if (listeComplete().some((c) => c.cle === cle)) {
      return { succes: false, erreur: "Cette catégorie existe déjà." };
    }

    const nouvelleCategorie = { cle, libelle, couleur: couleur || COULEUR_PAR_DEFAUT };
    const misesAJour = [...personnalisees, nouvelleCategorie];

    if (!sauvegarderPersonnalisees(misesAJour)) {
      return { succes: false, erreur: "Impossible d'enregistrer la catégorie (stockage local indisponible ou plein)." };
    }

    personnalisees = misesAJour;
    listeEnCache = null;
    return { succes: true, categorie: nouvelleCategorie };
  }

  return { obtenirLibelle, obtenirCouleur, peuplerSelect, ajouterCategorie };
})();
