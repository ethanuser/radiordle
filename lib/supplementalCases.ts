import type { SessionCase } from './session';
import { withBasePath } from './paths';

/**
 * Supplemental teaching cases bundled with the site (images in /public/cases).
 *
 * These cover the BiCEP chest-infection set (pneumonia, pleural effusion,
 * empyema, lung abscess) so Game Session works even without the Supabase
 * library. All images are openly licensed from Wikimedia Commons; the license
 * and author are shown with each case. The clinical vignettes (first hint) are
 * illustrative teaching context, not the source patients' histories.
 */
interface SupplementalCaseInput {
  id: string;
  image: string;
  answer: string;
  hints: string[];
  description: string;
  citation: string;
  learnLink: string;
}

const CASES: SupplementalCaseInput[] = [
  {
    id: 'S1',
    image: '/cases/pneumonia-rml-cxr.jpg',
    answer: 'Pneumonia',
    hints: [
      '67-year-old man with fever, productive cough and right-sided pleuritic chest pain.',
      'PA chest radiograph: homogeneous airspace opacity in the right mid-to-lower zone.',
      'The opacity abuts and partly obscures the right heart border (silhouette sign), localizing it to the right middle lobe.',
      'No meniscus, no cavity or air–fluid level, and no mediastinal shift.',
    ],
    description:
      'Infection of the lung parenchyma in which alveoli fill with inflammatory exudate. On radiographs it appears as airspace consolidation, often with air bronchograms, confined to a lobe or segment (lobar pneumonia) or patchy and multifocal (bronchopneumonia). The silhouette sign helps localize it: right middle lobe disease obscures the right heart border.',
    citation:
      'Image: Mikael Häggström, M.D. — “X-ray of lobar pneumonia”, Wikimedia Commons, CC0.',
    learnLink: 'https://en.wikipedia.org/wiki/Pneumonia',
  },
  {
    id: 'S2',
    image: '/cases/pleural-effusion-right-cxr.jpg',
    answer: 'Pleural effusion',
    hints: [
      'Adult with progressive shortness of breath; afebrile.',
      'PA chest radiograph: dense, homogeneous opacity at the right lung base.',
      'The upper border is concave and curves up along the lateral chest wall (meniscus sign); the costophrenic angle is obliterated.',
      'The opacity is uniform without air bronchograms, cavity or air–fluid level.',
    ],
    description:
      'Fluid accumulating in the pleural space. Upright radiographs show blunting of the costophrenic angle and a concave meniscus that rises laterally; larger effusions push the mediastinum away. Thoracentesis with Light’s criteria separates transudates (e.g. heart failure) from exudates (e.g. infection, malignancy).',
    citation:
      'Image: James Heilman, MD — “Effusion”, Wikimedia Commons, CC BY-SA 3.0.',
    learnLink: 'https://en.wikipedia.org/wiki/Pleural_effusion',
  },
  {
    id: 'S3',
    image: '/cases/empyema-left-ct.jpg',
    answer: 'Empyema',
    hints: [
      '66-year-old man with persistent fever and pleuritic pain despite antibiotics for pneumonia.',
      'Contrast-enhanced axial CT: lens-shaped (lenticular) fluid collection in the posterior left hemithorax.',
      'The collection is bounded by smooth, thickened, enhancing pleura (split pleura sign) and compresses the adjacent lung.',
      'The neighbouring lung is consolidated and contains small gas bubbles.',
    ],
    description:
      'Pus in the pleural space, usually complicating pneumonia. CT shows a loculated, lenticular collection with smooth, enhancing, separated visceral and parietal pleura (split pleura sign) that compresses — rather than destroys — the adjacent lung. Treatment requires drainage in addition to antibiotics.',
    citation:
      'Image: Hellerhoff — “Pleuraempyem mit angrenzend konsolidierter Lunge”, Wikimedia Commons, CC BY-SA 4.0.',
    learnLink: 'https://en.wikipedia.org/wiki/Pleural_empyema',
  },
  {
    id: 'S4',
    image: '/cases/lung-abscess-right-ct.jpg',
    answer: 'Lung abscess',
    hints: [
      'Patient with weeks of fever, night sweats and foul-smelling sputum; history of alcohol use.',
      'Axial CT (lung window): a round, gas-containing lesion in the anterior right lung.',
      'The lesion has a thick, irregular wall and lies within the lung parenchyma — it forms acute angles with the chest wall.',
      'Background patchy ground-glass opacities in both lungs.',
    ],
    description:
      'A necrotic, pus-filled cavity within the lung parenchyma, classically after aspiration. Imaging shows a thick-walled cavity, often with an air–fluid level, that is spherical and forms acute angles with the chest wall — features that help distinguish it from empyema, which is lenticular, obtuse-angled and compresses the lung.',
    citation:
      'Image: Yale Rosen — “Lung abscess – CT scan”, Wikimedia Commons, CC BY-SA 2.0.',
    learnLink: 'https://en.wikipedia.org/wiki/Lung_abscess',
  },
];

export const SUPPLEMENTAL_CASES: SessionCase[] = CASES.map((c) => ({
  id: `supplemental-${c.id}`,
  key: c.id,
  source: 'supplemental',
  label: `Supplemental ${c.id}`,
  imageUrl: withBasePath(c.image),
  annotatedImageUrl: null,
  answer: c.answer,
  hints: c.hints,
  description: c.description,
  citation: `${c.citation} Clinical vignette is illustrative.`,
  learnLink: c.learnLink,
  released: true,
}));
