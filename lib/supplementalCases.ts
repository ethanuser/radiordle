import type { SessionCase } from './session';
import { withBasePath } from './paths';

/**
 * Supplemental teaching cases bundled with the site (images in /public/cases).
 *
 * These cover the BiCEP chest-infection set (pneumonia, pleural effusion,
 * empyema, lung abscess), each with at least one chest radiograph and one CT,
 * plus radiographs of the main non-infectious mimics (pulmonary edema,
 * atelectasis) and radiographs/CTs of pulmonary fibrosis, emphysema and lung
 * cancer for the pulmonary infiltrate patterns session, so Game Session works
 * even without the Supabase library. Images are openly
 * licensed (Radiopaedia CC BY-NC-SA, Wikimedia Commons); the license and author
 * are shown with each case. Unless a case is marked `vignetteFromSource`, its
 * clinical vignette (first hint) is illustrative teaching context, not the
 * source patient's history.
 */
type Diagnosis =
  | 'Pneumonia'
  | 'Pleural effusion'
  | 'Empyema'
  | 'Lung abscess'
  | 'Pulmonary edema'
  | 'Atelectasis'
  | 'Pulmonary fibrosis'
  | 'Emphysema'
  | 'Lung cancer';
type Modality = 'X-ray' | 'CT';

interface SupplementalCaseInput {
  id: string;
  image: string;
  answer: Diagnosis;
  modality: Modality;
  hints: string[];
  citation: string;
  /** True when the first hint is the source case's own history. */
  vignetteFromSource?: boolean;
}

/** Teaching note and "Learn more" link shown after each case, per diagnosis. */
const ABOUT: Record<Diagnosis, { description: string; learnLink: string }> = {
  Pneumonia: {
    description:
      'Infection of the lung parenchyma in which alveoli fill with inflammatory exudate. Imaging shows airspace consolidation, often with air bronchograms, confined to a lobe or segment (lobar pneumonia) or patchy and multifocal (bronchopneumonia). The silhouette sign helps localize it on radiographs, and fissures form its sharp borders. Unlike an abscess there is no cavity; unlike an effusion there is no meniscus and no mass effect.',
    learnLink: 'https://radiopaedia.org/articles/lobar-pneumonia',
  },
  'Pleural effusion': {
    description:
      'Fluid accumulating in the pleural space. Upright radiographs show blunting of the costophrenic angle and a concave meniscus that rises laterally; larger effusions push the mediastinum away and compress the lung. On CT, simple fluid layers dependently with thin, non-enhancing pleura — enhancing, thickened pleura and loculation suggest empyema. Thoracentesis with Light’s criteria separates transudates from exudates.',
    learnLink: 'https://radiopaedia.org/articles/pleural-effusion',
  },
  Empyema: {
    description:
      'Pus in the pleural space, usually complicating pneumonia. It is loculated and lenticular (biconvex), forms obtuse angles with the chest wall and compresses — rather than destroys — the adjacent lung. On CT the thickened, enhancing visceral and parietal pleura separated by fluid give the split pleura sign; gas bubbles may be present. Treatment requires drainage in addition to antibiotics.',
    learnLink: 'https://radiopaedia.org/articles/empyema',
  },
  'Lung abscess': {
    description:
      'A necrotic, pus-filled cavity within the lung parenchyma, classically after aspiration. Imaging shows a thick-walled cavity, often with an air–fluid level, that is spherical and forms acute angles with the chest wall — features that help distinguish it from empyema, which is lenticular, obtuse-angled and compresses the lung. Cavitating cancer and metastases are the main differentials.',
    learnLink: 'https://radiopaedia.org/articles/lung-abscess',
  },
  'Pulmonary edema': {
    description:
      'Fluid leaking from pulmonary capillaries into the interstitium and then the alveoli, most often from raised pulmonary venous pressure in left heart failure. Radiographs show upper-lobe venous diversion, then interstitial edema (Kerley B lines, peribronchial cuffing, hazy hila) and finally perihilar “bat-wing” airspace opacities, usually with cardiomegaly and bilateral effusions. It is bilateral and gravity-dependent and clears quickly with diuresis, unlike pneumonia.',
    learnLink: 'https://radiopaedia.org/articles/pulmonary-oedema',
  },
  Atelectasis: {
    description:
      'Collapse of lung with loss of volume, most often from resorption of air distal to an obstructed bronchus (mucus plug, tumor, foreign body) or from compression by fluid or a mass. The collapsed lobe is dense, and the fissures, hilum, hemidiaphragm, trachea and mediastinum shift toward it. Each lobe has a typical shape: the right upper lobe gives the Golden S sign when a central mass is present, the left upper lobe a hazy veil, and the left lower lobe a triangular “sail” behind the heart.',
    learnLink: 'https://radiopaedia.org/articles/lobar-collapse',
  },
  'Pulmonary fibrosis': {
    description:
      'Irreversible scarring of the lung interstitium, classically idiopathic pulmonary fibrosis (usual interstitial pneumonia pattern) in older adults; also connective tissue disease, drugs (amiodarone, bleomycin, methotrexate) and asbestos. HRCT shows subpleural, basal-predominant reticulation, traction bronchiectasis and honeycombing: clustered cystic spaces with thick shared walls. Physiology is restrictive (small lungs, normal or raised FEV1/FVC) with a low DLCO.',
    learnLink: 'https://radiopaedia.org/articles/idiopathic-pulmonary-fibrosis',
  },
  Emphysema: {
    description:
      'Permanent enlargement of the airspaces beyond the terminal bronchioles from destruction of alveolar walls. Smoking causes centrilobular emphysema, worst in the upper lobes; alpha-1 antitrypsin deficiency causes panlobular emphysema, worst in the lower lobes. CT shows lucent areas without visible walls, often with a central dot (the centrilobular artery); radiographs show large lungs with flattened hemidiaphragms. Physiology is obstructive (low FEV1/FVC, high total lung capacity, low DLCO).',
    learnLink: 'https://radiopaedia.org/articles/pulmonary-emphysema',
  },
  'Lung cancer': {
    description:
      'The leading cause of cancer death, strongly linked to smoking. Adenocarcinoma tends to be peripheral (and is the commonest type in non-smokers); squamous cell and small cell carcinoma tend to be central, and squamous cell tumors may cavitate. A Pancoast (superior sulcus) tumor at the apex can cause shoulder pain, Horner syndrome and rib destruction. Small cell carcinoma spreads early to mediastinal nodes and causes paraneoplastic syndromes. Imaging shows a mass or nodule, sometimes with cavitation, hilar or mediastinal adenopathy, collapse or effusion.',
    learnLink: 'https://radiopaedia.org/articles/lung-cancer-3',
  },
};

const RADIOPAEDIA = (author: string, rid: number) =>
  `Case courtesy of ${author}, Radiopaedia.org, rID: ${rid} (CC BY-NC-SA 3.0).`;

const CASES: SupplementalCaseInput[] = [
  // ---------------- Pneumonia ----------------
  {
    id: 'S1',
    image: '/cases/pneumonia-rml-cxr.jpg',
    answer: 'Pneumonia',
    modality: 'X-ray',
    hints: [
      '67-year-old man with fever, productive cough and right-sided pleuritic chest pain.',
      'PA chest radiograph: homogeneous airspace opacity in the right mid-to-lower zone.',
      'The opacity abuts and partly obscures the right heart border (silhouette sign), localizing it to the right middle lobe.',
      'No meniscus, no cavity or air–fluid level, and no mediastinal shift.',
    ],
    citation: 'Image: Mikael Häggström, M.D. — “X-ray of lobar pneumonia”, Wikimedia Commons, CC0.',
  },
  {
    id: 'S5',
    image: '/cases/pneumonia-rul-cxr.jpg',
    answer: 'Pneumonia',
    modality: 'X-ray',
    hints: [
      '15-year-old boy with cough and shortness of breath for a week.',
      'PA chest radiograph: dense, homogeneous opacity in the right upper zone.',
      'Its inferior border is sharp and flat, following the horizontal fissure — the opacity fills the right upper lobe without volume loss.',
      'Heart size normal; left lung clear; no meniscus or cavity.',
    ],
    citation: RADIOPAEDIA('Ian Bickle', 160922),
    vignetteFromSource: true,
  },
  {
    id: 'S6',
    image: '/cases/pneumonia-lul-ct.jpg',
    answer: 'Pneumonia',
    modality: 'CT',
    hints: [
      '55-year-old smoker with chest pain, fever and cough; the chest radiograph raised concern for cancer.',
      'Axial CT (lung window): the left upper lobe is uniformly dense and solid-appearing.',
      'Patent, air-filled bronchi branch through the dense lobe (air bronchograms); there is no volume loss.',
      'No cavity or discrete mass; reactive mediastinal lymph nodes.',
    ],
    citation: RADIOPAEDIA("Chris O'Donnell", 32998),
    vignetteFromSource: true,
  },
  {
    id: 'S13',
    image: '/cases/pneumonia-broncho-cxr.jpg',
    answer: 'Pneumonia',
    modality: 'X-ray',
    hints: [
      '15-year-old girl with cough, fever and raised inflammatory markers.',
      'PA chest radiograph: patchy, partly confluent nodular airspace opacities in both lungs.',
      'They are worse on the left and at the lung bases and do not respect a single lobe (bronchopneumonia pattern).',
      'Heart size normal; no effusion, cavity or volume loss.',
    ],
    citation: RADIOPAEDIA('Nico Behnke', 192330),
    vignetteFromSource: true,
  },
  {
    id: 'S14',
    image: '/cases/pneumonia-atypical-cxr.jpg',
    answer: 'Pneumonia',
    modality: 'X-ray',
    hints: [
      '30-year-old non-smoker with a dry cough for two weeks.',
      'PA chest radiograph: bronchial wall thickening in both perihilar regions extending toward the bases.',
      'Patchy, non-segmental opacities in both lower lobes; no lobar consolidation (atypical pattern, here Mycoplasma).',
      'Heart size normal; no pleural effusion.',
    ],
    citation: RADIOPAEDIA('Alborz Jahangiri', 45781),
    vignetteFromSource: true,
  },

  // ---------------- Pleural effusion ----------------
  {
    id: 'S2',
    image: '/cases/pleural-effusion-right-cxr.jpg',
    answer: 'Pleural effusion',
    modality: 'X-ray',
    hints: [
      'Adult with progressive shortness of breath; afebrile.',
      'PA chest radiograph: dense, homogeneous opacity at the right lung base.',
      'The upper border is concave and curves up along the lateral chest wall (meniscus sign); the costophrenic angle is obliterated.',
      'The opacity is uniform without air bronchograms, cavity or air–fluid level.',
    ],
    citation: 'Image: James Heilman, MD — “Effusion”, Wikimedia Commons, CC BY-SA 3.0.',
  },
  {
    id: 'S7',
    image: '/cases/pleural-effusion-right-cxr-2.jpg',
    answer: 'Pleural effusion',
    modality: 'X-ray',
    hints: [
      '65-year-old man with a short history of progressive shortness of breath.',
      'PA chest radiograph: homogeneous opacity occupying the lower right hemithorax.',
      'Its upper edge tapers upward along the lateral chest wall (meniscus); the right costophrenic angle and hemidiaphragm are obscured.',
      'Mild cardiomegaly; the left lung is clear.',
    ],
    citation: RADIOPAEDIA('Ian Bickle', 50364),
    vignetteFromSource: true,
  },
  {
    id: 'S8',
    image: '/cases/pleural-effusion-right-ct.jpg',
    answer: 'Pleural effusion',
    modality: 'CT',
    hints: [
      '75-year-old smoker with shortness of breath.',
      'Axial CT: a large, homogeneous collection fills most of the right hemithorax, with near-complete collapse of the right lung.',
      'No pleural thickening and no pleural mass.',
      'The distal right lower lobe bronchus is collapsed; part of the right upper lobe remains aerated.',
    ],
    citation: RADIOPAEDIA('Pranav Sharma', 88270),
    vignetteFromSource: true,
  },

  // ---------------- Empyema ----------------
  {
    id: 'S3',
    image: '/cases/empyema-left-ct.jpg',
    answer: 'Empyema',
    modality: 'CT',
    hints: [
      '66-year-old man with persistent fever and pleuritic pain despite antibiotics for pneumonia.',
      'Contrast-enhanced axial CT: lens-shaped (lenticular) fluid collection in the posterior left hemithorax.',
      'The collection is bounded by smooth, thickened, enhancing pleura (split pleura sign) and compresses the adjacent lung.',
      'The neighbouring lung is consolidated and contains small gas bubbles.',
    ],
    citation:
      'Image: Hellerhoff — “Pleuraempyem mit angrenzend konsolidierter Lunge”, Wikimedia Commons, CC BY-SA 4.0.',
  },
  {
    id: 'S9',
    image: '/cases/empyema-left-cxr.jpg',
    answer: 'Empyema',
    modality: 'X-ray',
    hints: [
      '60-year-old man with cough and fever.',
      'PA chest radiograph: a large opacity along the lateral wall of the left hemithorax.',
      'It is biconvex (lens-shaped) and meets the chest wall at obtuse angles — it arises from the pleural space, not the lung.',
      'Heart size normal; the right lung and right pleural space are clear.',
    ],
    citation: RADIOPAEDIA('Ian Bickle', 74921),
    vignetteFromSource: true,
  },
  {
    id: 'S10',
    image: '/cases/empyema-right-ct.jpg',
    answer: 'Empyema',
    modality: 'CT',
    hints: [
      '60-year-old with fever, dyspnea and right-sided pleuritic pain.',
      'Contrast-enhanced axial CT: a right pleural fluid collection.',
      'Both the parietal and visceral pleura are markedly thickened and enhance, separated by the fluid (split pleura sign).',
      'Small gas bubbles within the collection; increased density in the adjacent right lower lobe.',
    ],
    citation: RADIOPAEDIA('David Puyó Vera', 34200),
    vignetteFromSource: true,
  },

  // ---------------- Lung abscess ----------------
  {
    id: 'S4',
    image: '/cases/lung-abscess-right-cxr.jpg',
    answer: 'Lung abscess',
    modality: 'X-ray',
    hints: [
      '40-year-old woman with fever, right-sided chest pain and cough productive of foul-smelling sputum.',
      'PA chest radiograph: a rounded lucency with a thick wall in the right mid-to-lower zone.',
      'The lesion contains a horizontal air–fluid level, and its margins are smooth and well defined.',
      'The lesion lies within the lung (right middle lobe) rather than along the pleura; the left lung is clear.',
    ],
    citation: RADIOPAEDIA('Abiola Ayodele', 91614),
    vignetteFromSource: true,
  },
  {
    id: 'S11',
    image: '/cases/lung-abscess-rll-ct.jpg',
    answer: 'Lung abscess',
    modality: 'CT',
    hints: [
      '65-year-old man with fever and chest pain.',
      'Axial CT: a large cavitary lesion in the right lower lobe containing a horizontal air–fluid level.',
      'It is round and arises within the lung; where it touches the chest wall the angle is acute.',
      'No pleural effusion.',
    ],
    citation: RADIOPAEDIA('Stefan Tigges', 97308),
    vignetteFromSource: true,
  },
  {
    id: 'S12',
    image: '/cases/lung-abscess-rll-ct-2.jpg',
    answer: 'Lung abscess',
    modality: 'CT',
    hints: [
      '55-year-old man with fever and productive cough.',
      'Axial CT (lung window): a large, gas-filled cavity in the right lower lobe.',
      'The cavity wall is thick and irregular, and the cavity lies within the lung parenchyma.',
      'Clustered ground-glass nodules elsewhere in both lungs.',
    ],
    citation: RADIOPAEDIA('Stefan Tigges', 244645),
    vignetteFromSource: true,
  },

  // ---------------- Pulmonary edema ----------------
  {
    id: 'S15',
    image: '/cases/pulmonary-edema-cxr.jpg',
    answer: 'Pulmonary edema',
    modality: 'X-ray',
    hints: [
      '75-year-old man with progressive exertional dyspnea, dry cough and SpO₂ 89%; afebrile with normal WBC and CRP.',
      'PA chest radiograph: extensive bilateral perihilar opacity fading toward the periphery (bat-wing distribution).',
      'Kerley B lines at both lung bases; both costophrenic angles are blunted (small effusions).',
      'Mild cardiomegaly; a necklace artifact projects over the neck.',
    ],
    citation: RADIOPAEDIA('Tornike Mshvildadze', 213687),
    vignetteFromSource: true,
  },
  {
    id: 'S16',
    image: '/cases/pulmonary-edema-cxr-2.jpg',
    answer: 'Pulmonary edema',
    modality: 'X-ray',
    hints: [
      '60-year-old woman with three days of cough, dyspnea and leg swelling.',
      'PA chest radiograph: increased central and lower-zone opacity obscuring the pulmonary vessels.',
      'Short horizontal septal (Kerley B) lines at the lung periphery and a right pleural effusion.',
      'Cardiomegaly with a pacemaker.',
    ],
    citation: RADIOPAEDIA('Guillermo César Vélez Parra', 196533),
    vignetteFromSource: true,
  },

  // ---------------- Atelectasis ----------------
  {
    id: 'S17',
    image: '/cases/atelectasis-rul-cxr.jpg',
    answer: 'Atelectasis',
    modality: 'X-ray',
    hints: [
      '70-year-old woman, a smoker, with shortness of breath.',
      'PA chest radiograph: dense opacity in the right upper zone with an elevated horizontal fissure.',
      'The fissure is concave laterally and bulges convexly around a right hilar mass (Golden S sign).',
      'Volume loss: the mediastinum shifts to the right and the right hemidiaphragm is raised.',
    ],
    citation: RADIOPAEDIA('Ian Bickle', 80327),
    vignetteFromSource: true,
  },
  {
    id: 'S18',
    image: '/cases/atelectasis-lul-cxr.jpg',
    answer: 'Atelectasis',
    modality: 'X-ray',
    hints: [
      '80-year-old woman with cough and dyspnea; reduced air entry on the left.',
      'PA chest radiograph: hazy, veil-like opacity over the left hemithorax, which is smaller than the right.',
      'A crescent of lucency outlines the aortic knob (luftsichel sign) from the over-expanded left lower lobe.',
      'Left hilar opacity; no air bronchograms, meniscus or cavity.',
    ],
    citation: RADIOPAEDIA('Naim Qaqish', 82570),
    vignetteFromSource: true,
  },

  // ---------------- Pulmonary fibrosis ----------------
  {
    id: 'S19',
    image: '/cases/fibrosis-honeycombing-ct.jpg',
    answer: 'Pulmonary fibrosis',
    modality: 'CT',
    hints: [
      '70-year-old man with years of worsening exertional dyspnea, a dry cough and finger clubbing.',
      'Axial HRCT (lung window) through the lung bases.',
      'Clustered cystic air spaces with thick shared walls line the periphery of both lungs (honeycombing).',
      'The remaining lung is reticular and distorted; no consolidation, mass or effusion.',
    ],
    citation: RADIOPAEDIA('Frank Gaillard', 35820),
  },
  {
    id: 'S20',
    image: '/cases/fibrosis-ipf-ct.jpg',
    answer: 'Pulmonary fibrosis',
    modality: 'CT',
    hints: [
      '55-year-old man on home oxygen, followed for a chronic lung disease that also affected his father and grandfather.',
      'Axial HRCT (lung window): fine reticular lines in the periphery of both lungs, worst posteriorly.',
      'Small subpleural cystic spaces (honeycombing) and dilated, distorted airways within the scarred lung (traction bronchiectasis).',
      'The changes are subpleural and basal-predominant, without a nodular or ground-glass-dominant pattern.',
    ],
    citation: RADIOPAEDIA('Fabio Macori', 57238),
    vignetteFromSource: true,
  },

  // ---------------- Emphysema ----------------
  {
    id: 'S21',
    image: '/cases/emphysema-ct.jpg',
    answer: 'Emphysema',
    modality: 'CT',
    hints: [
      '65-year-old man with shortness of breath.',
      'Axial CT (lung window) through the upper lobes.',
      'Many small round lucent areas without visible walls, some with a central dot (the centrilobular artery).',
      'Upper-lobe predominant; no honeycombing, mass or consolidation.',
    ],
    citation: RADIOPAEDIA('Moamer Abdulghafoor Ibrahim', 166582),
    vignetteFromSource: true,
  },
  {
    id: 'S22',
    image: '/cases/emphysema-coronal-ct.jpg',
    answer: 'Emphysema',
    modality: 'CT',
    hints: [
      'Heavy smoker with shortness of breath on exertion.',
      'Coronal CT (lung window).',
      'Extensive lucent areas with imperceptible walls where lung tissue has been destroyed, worst in the upper lobes.',
      'Large lung volumes; no honeycombing, mass or effusion.',
    ],
    citation: RADIOPAEDIA('Ammar Haouimi', 247105),
    vignetteFromSource: true,
  },

  // ---------------- Lung cancer ----------------
  {
    id: 'S23',
    image: '/cases/lung-cancer-cavitating-cxr.jpg',
    answer: 'Lung cancer',
    modality: 'X-ray',
    hints: [
      '60-year-old man with weight loss and cough.',
      'PA chest radiograph: a large, irregular mass in the left mid zone next to the hilum.',
      'The mass contains a central lucency with an air–fluid level; its wall is thick and irregular.',
      'Weight loss and a thick, nodular cavity wall point away from a simple abscess.',
    ],
    citation: RADIOPAEDIA('Frank Gaillard', 19639),
    vignetteFromSource: true,
  },
  {
    id: 'S24',
    image: '/cases/lung-cancer-pancoast-cxr.jpg',
    answer: 'Lung cancer',
    modality: 'X-ray',
    hints: [
      '55-year-old man with four weeks of worsening right shoulder and chest pain; his wife has noticed his right eyelid drooping.',
      'PA chest radiograph: an opacity at the right lung apex.',
      'Coarse lines extend from it down to an elevated right hilum, and the right first rib is eroded.',
      'Both lungs are hyperinflated and lucent (background COPD).',
    ],
    citation: RADIOPAEDIA('Craig Hacking', 73294),
    vignetteFromSource: true,
  },
  {
    id: 'S25',
    image: '/cases/lung-cancer-small-cell-ct.jpg',
    answer: 'Lung cancer',
    modality: 'CT',
    hints: [
      '45-year-old woman, a smoker, with six months of cough, a hoarse voice and difficulty swallowing, and two months of weight loss.',
      'Coronal contrast-enhanced CT of the chest.',
      'Bulky lymph nodes fill and widen the mediastinum around the central vessels and airways.',
      'An abnormality at the left lung apex and a small pericardial effusion.',
    ],
    citation: RADIOPAEDIA('Liam Pugh', 57802),
    vignetteFromSource: true,
  },
];

export const SUPPLEMENTAL_CASES: SessionCase[] = CASES.map((c) => ({
  id: `supplemental-${c.id}`,
  key: c.id,
  source: 'supplemental',
  label: `Supplemental ${c.id} · ${c.modality}`,
  imageUrl: withBasePath(c.image),
  annotatedImageUrl: null,
  answer: c.answer,
  hints: c.hints,
  description: ABOUT[c.answer].description,
  citation: c.vignetteFromSource ? c.citation : `${c.citation} Clinical vignette is illustrative.`,
  learnLink: ABOUT[c.answer].learnLink,
  released: true,
}));
