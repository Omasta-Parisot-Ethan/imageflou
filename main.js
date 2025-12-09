/**
 * Génère un noyau gaussien normalisé.
 * @param {number} rayon
 * @returns {number[][]}
 */
function genererNoyauGaussien(rayon) {
    const taille = rayon * 2 + 1;
    const noyau = Array.from({ length: taille }, () => Array(taille).fill(0));

    const sigma = rayon / 2 || 1;
    const deuxSigmaCarre = 2 * sigma * sigma;

    let somme = 0;

    for (let y = -rayon; y <= rayon; y++) {
        for (let x = -rayon; x <= rayon; x++) {
            const valeur = Math.exp(-(x * x + y * y) / deuxSigmaCarre);
            noyau[y + rayon][x + rayon] = valeur;
            somme += valeur;
        }
    }

    // Normalisation
    for (let y = 0; y < taille; y++) {
        for (let x = 0; x < taille; x++) {
            noyau[y][x] /= somme;
        }
    }

    return noyau;
}


/**
 * Convolution manuelle sur un ImageData.
 * @param {ImageData} imageData
 * @param {number[][]} noyau
 * @returns {ImageData}
 */
function appliquerConvolution(imageData, noyau) {
    const largeur = imageData.width;
    const hauteur = imageData.height;
    const donnees = imageData.data;

    const resultat = new ImageData(largeur, hauteur);
    const sortie = resultat.data;

    const rayon = (noyau.length - 1) / 2;

    const indice = (x, y) => 4 * (y * largeur + x);

    for (let y = 0; y < hauteur; y++) {
        for (let x = 0; x < largeur; x++) {

            let r = 0, g = 0, b = 0;

            for (let j = -rayon; j <= rayon; j++) {
                for (let i = -rayon; i <= rayon; i++) {

                    const px = Math.min(Math.max(x + i, 0), largeur - 1);
                    const py = Math.min(Math.max(y + j, 0), hauteur - 1);

                    const k = noyau[j + rayon][i + rayon];
                    const idx = indice(px, py);

                    r += donnees[idx] * k;
                    g += donnees[idx + 1] * k;
                    b += donnees[idx + 2] * k;
                }
            }

            const idxSortie = indice(x, y);
            sortie[idxSortie] = r;
            sortie[idxSortie + 1] = g;
            sortie[idxSortie + 2] = b;
            sortie[idxSortie + 3] = 255; // alpha opaque
        }
    }

    return resultat;
}


/**
 * Charge l’image dans un canvas.
 */
document.getElementById("fichierImage").addEventListener("change", async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    const img = new Image();
    img.src = URL.createObjectURL(fichier);
    await img.decode();

    const c = document.getElementById("canvasOriginal");
    const ctx = c.getContext("2d");

    c.width = img.width;
    c.height = img.height;

    ctx.drawImage(img, 0, 0);
});


/**
 * Bouton : appliquer le flou gaussien.
 */
document.getElementById("btnFlou").addEventListener("click", () => {
    const rayon = parseInt(document.getElementById("rayon").value, 10);

    if (isNaN(rayon) || rayon < 1) {
        console.error("Le rayon doit être >= 1");
        return;
    }

    const canvasOriginal = document.getElementById("canvasOriginal");
    const ctxOriginal = canvasOriginal.getContext("2d");
    const imageData = ctxOriginal.getImageData(0, 0, canvasOriginal.width, canvasOriginal.height);

    const noyau = genererNoyauGaussien(rayon);
    const floute = appliquerConvolution(imageData, noyau);

    const canvasFlou = document.getElementById("canvasFlou");
    const ctxFlou = canvasFlou.getContext("2d");

    canvasFlou.width = canvasOriginal.width;
    canvasFlou.height = canvasOriginal.height;

    ctxFlou.putImageData(floute, 0, 0);
});
