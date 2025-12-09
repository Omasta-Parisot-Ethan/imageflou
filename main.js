// Nécessite : npm install jimp

import Jimp from "jimp";

/**
 * Génère un noyau (kernel) gaussien normalisé en fonction d'un rayon.
 * @param {number} rayon - Rayon du flou.
 * @returns {number[][]} Matrice 2D du noyau gaussien.
 */
function genererNoyauGaussien(rayon) {
    const taille = rayon * 2 + 1;
    const noyau = new Array(taille).fill(null).map(() => new Array(taille).fill(0));
    const sigma = rayon / 2 || 1; // éviter division par zéro
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
 * Applique une convolution avec un noyau donné sur l'image.
 * @param {Jimp} image - Image à traiter.
 * @param {number[][]} noyau - Matrice de convolution.
 * @returns {Promise<Jimp>} - Nouvelle image convoluée.
 */
async function appliquerConvolution(image, noyau) {
    const largeur = image.bitmap.width;
    const hauteur = image.bitmap.height;

    const resultat = image.clone();
    const rayon = (noyau.length - 1) / 2;

    for (let y = 0; y < hauteur; y++) {
        for (let x = 0; x < largeur; x++) {

            let r = 0, g = 0, b = 0;

            for (let j = -rayon; j <= rayon; j++) {
                for (let i = -rayon; i <= rayon; i++) {

                    const px = Math.min(Math.max(x + i, 0), largeur - 1);
                    const py = Math.min(Math.max(y + j, 0), hauteur - 1);

                    const { r: pr, g: pg, b: pb } = Jimp.intToRGBA(image.getPixelColor(px, py));
                    const coeff = noyau[j + rayon][i + rayon];

                    r += pr * coeff;
                    g += pg * coeff;
                    b += pb * coeff;
                }
            }

            resultat.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
        }
    }

    return resultat;
}

/**
 * Applique un flou gaussien à une image JPEG.
 * @param {string} cheminEntree - Chemin vers l'image JPEG source.
 * @param {string} cheminSortie - Chemin du fichier flouté.
 * @param {number} rayon - Rayon du flou.
 */
async function flouterImageGaussienne(cheminEntree, cheminSortie, rayon) {
    if (rayon < 1) throw new Error("Le rayon doit être >= 1.");

    const image = await Jimp.read(cheminEntree);

    const noyau = genererNoyauGaussien(rayon);
    const imageFloutee = await appliquerConvolution(image, noyau);

    await imageFloutee.quality(100).writeAsync(cheminSortie);

    console.log("Image floutée enregistrée :", cheminSortie);
}

// Exemple d'utilisation :
flouterImageGaussienne("entree.jpg", "floute.jpg", 5)
    .catch(console.error);
