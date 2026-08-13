export type SupportedLanguage = 'en' | 'it' | 'es' | 'nl' | 'de' | 'fr'

export interface LanguageOption {
  code: SupportedLanguage
  name: string
  flag: string
  team?: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', team: 'Global / F1' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', team: 'Scuderia Ferrari' },
  { code: 'es', name: 'Español', flag: '🇪🇸', team: 'Aston Martin / Williams' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', team: 'Red Bull Racing' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', team: 'Mercedes AMG' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', team: 'Alpine F1' }
]

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, any>> = {
  en: {
    header: {
      title: 'SILENT CO-DRIVER',
      subtitle: 'AI COCKPIT STEERING CONTROLLER',
      status: 'STEERING DISPLAY ONLINE',
      language: 'Language'
    },
    viewer3d: {
      title: '3D TELEMETRY MATRIX',
      subtitle: 'Live Aero & Thermal Model (Interactive 360°)',
      livery: 'Livery:',
      model: 'Model:',
      cameraView: 'Camera View:',
      orbit: '360° Orbit',
      cockpit: 'Cockpit',
      frontAero: 'Front Aero',
      rearDrs: 'Rear DRS',
      sideAero: 'Side Aero',
      pauseRotation: 'Pause Rotation',
      playRotation: 'Play Rotation',
      wireframe: 'Wireframe',
      loading: 'APPLYING F1 LIVERY & MATERIALS...'
    },
    driverState: {
      title: 'DRIVER STATE',
      stressLevel: 'STRESS LEVEL',
      fatigue: 'FATIGUE',
      confidence: 'CONFIDENCE',
      gear: 'GEAR',
      speed: 'SPEED',
      lap: 'LAP',
      delta: 'DELTA',
      nominal: 'NOMINAL',
      caution: 'CAUTION',
      warning: 'WARNING',
      critical: 'CRITICAL ALERT'
    },
    insights: {
      title: 'AI PIT-WALL STRATEGY',
      subtitle: 'Real-time Tac-Comm & Decision Engine',
      strategicInsight: 'STRATEGIC INSIGHT',
      tacticalRecommendation: 'TACTICAL RECOMMENDATION',
      aiConfidence: 'AI CONFIDENCE',
      alertTriggered: 'CRITICAL ALERT TRIGGERED'
    },
    transcript: {
      title: 'RADIO TRANSCRIPTION',
      driverSpeaker: 'DRIVER RADIO (LIVE)',
      emotionState: 'EMOTIONAL STATE',
      noAudio: 'No active radio transmission analyzed.'
    },
    uploader: {
      demoClips: 'F1 DEMO CLIPS',
      talkLive: 'TALK LIVE (MIC)',
      dropAudio: 'Drop audio file or click to upload',
      supportedFormats: 'WAV, MP3, M4A supported',
      analyzing: 'ANALYZING DRIVER TELEMETRY...',
      analyzeBtn: 'ANALYZE TRANSMISSION',
      recording: 'RECORDING DRIVER RADIO...',
      stopRecord: 'STOP & ANALYZE'
    },
    telemetryChart: {
      title: 'LAP TELEMETRY & MOOD TRACKER',
      lapTime: 'Lap Time',
      sector1: 'Sector 1',
      sector2: 'Sector 2',
      sector3: 'Sector 3',
      tyreAge: 'Tyre Age',
      compound: 'Compound'
    }
  },
  it: {
    header: {
      title: 'CO-PILOTA SILENZIOSO',
      subtitle: 'CONTROLLER DI STERZO IA',
      status: 'DISPLAY STERZO ATTIVO',
      language: 'Lingua'
    },
    viewer3d: {
      title: 'MATRICE TELEMETRICA 3D',
      subtitle: 'Modello Aerodinamico & Termico Live (360°)',
      livery: 'Livrea:',
      model: 'Modello:',
      cameraView: 'Vista Telecamera:',
      orbit: 'Orbita 360°',
      cockpit: 'Abitacolo',
      frontAero: 'Aero Anteriore',
      rearDrs: 'DRS Posteriore',
      sideAero: 'Aero Laterale',
      pauseRotation: 'Pausa Rotazione',
      playRotation: 'Avvia Rotazione',
      wireframe: 'Modello Wireframe',
      loading: 'APPLICAZIONE LIVREA F1 & MATERIALI...'
    },
    driverState: {
      title: 'STATO DEL PILOTA',
      stressLevel: 'LIVELLO DI STRESS',
      fatigue: 'STANCHEZZA',
      confidence: 'FIDUCIA',
      gear: 'MARCIA',
      speed: 'VELOCITÀ',
      lap: 'GIRO',
      delta: 'DELTA',
      nominal: 'NOMINALE',
      caution: 'ATTENZIONE',
      warning: 'AVVERTIMENTO',
      critical: 'ALLARME CRITICO'
    },
    insights: {
      title: 'STRATEGIA MURETTO IA',
      subtitle: 'Motore di Decisione Tattica In Tempo Reale',
      strategicInsight: 'ANALISI STRATEGICA',
      tacticalRecommendation: 'RACCOMANDAZIONE TATTICA',
      aiConfidence: 'AFFIDABILITÀ IA',
      alertTriggered: 'ALLARME CRITICO ATTIVATO'
    },
    transcript: {
      title: 'TRASCRIZIONE RADIO',
      driverSpeaker: 'RADIO PILOTA (LIVE)',
      emotionState: 'STATO EMOTIVO',
      noAudio: 'Nessuna trasmissione radio analizzata.'
    },
    uploader: {
      demoClips: 'CLIP DEMO F1',
      talkLive: 'PARLA IN DIRETTÀ (MICROFONO)',
      dropAudio: 'Trascina il file audio o clicca per caricare',
      supportedFormats: 'Supporta WAV, MP3, M4A',
      analyzing: 'ANALISI TELEMETRIA PILOTA IN CORSO...',
      analyzeBtn: 'ANALIZZA TRASMISSIONE',
      recording: 'REGISTRAZIONE RADIO PILOTA...',
      stopRecord: 'STOP & ANALIZZA'
    },
    telemetryChart: {
      title: 'TELEMETRIA GIRO & MONITORAGGIO UMORE',
      lapTime: 'Tempo sul Giro',
      sector1: 'Settore 1',
      sector2: 'Settore 2',
      sector3: 'Settore 3',
      tyreAge: 'Età Pneumatici',
      compound: 'Mescola'
    }
  },
  es: {
    header: {
      title: 'COPILOTO SILENCIOSO',
      subtitle: 'CONTROLADOR DE VOLANTE IA',
      status: 'PANTALLA DE VOLANTE ACTIVA',
      language: 'Idioma'
    },
    viewer3d: {
      title: 'MATRIZ TELEMÉTRICA 3D',
      subtitle: 'Modelo Aerodinámico y Térmico (360°)',
      livery: 'Decoración:',
      model: 'Modelo:',
      cameraView: 'Cámara:',
      orbit: 'Órbita 360°',
      cockpit: 'Cabina',
      frontAero: 'Aero Delantero',
      rearDrs: 'DRS Trasero',
      sideAero: 'Aero Lateral',
      pauseRotation: 'Pausar Rotación',
      playRotation: 'Reanudar Rotación',
      wireframe: 'Estructura Alámbrica',
      loading: 'APLICANDO DECORACIÓN F1 Y MATERIALES...'
    },
    driverState: {
      title: 'ESTADO DEL PILOTO',
      stressLevel: 'NIVEL DE ESTRÉS',
      fatigue: 'FATIGA',
      confidence: 'CONFIANZA',
      gear: 'MARCHA',
      speed: 'VELOCIDAD',
      lap: 'VUELTA',
      delta: 'DELTA',
      nominal: 'NOMINAL',
      caution: 'PRECAUCIÓN',
      warning: 'ADVERTENCIA',
      critical: 'ALERTA CRÍTICA'
    },
    insights: {
      title: 'ESTRATEGIA DE MURO IA',
      subtitle: 'Motor de Decisión Táctica en Tiempo Real',
      strategicInsight: 'ANÁLISIS ESTRATÉGICO',
      tacticalRecommendation: 'RECOMENDACIÓN TÁCTICA',
      aiConfidence: 'CONFIANZA IA',
      alertTriggered: 'ALERTA CRÍTICA ACTIVADA'
    },
    transcript: {
      title: 'TRANSCRIPCIÓN DE RADIO',
      driverSpeaker: 'RADIO PILOTO (EN VIVO)',
      emotionState: 'ESTADO EMOCIONAL',
      noAudio: 'No se ha analizado transmisión de radio.'
    },
    uploader: {
      demoClips: 'CLIPS DEMO F1',
      talkLive: 'HABLAR EN VIVO (MIC)',
      dropAudio: 'Arrastra archivo de audio o haz clic para subir',
      supportedFormats: 'Formatos WAV, MP3, M4A',
      analyzing: 'ANALIZANDO TELEMETRÍA DEL PILOTO...',
      analyzeBtn: 'ANALIZAR TRANSMISIÓN',
      recording: 'GRABANDO RADIO DEL PILOTO...',
      stopRecord: 'DETENER Y ANALIZAR'
    },
    telemetryChart: {
      title: 'TELEMETRÍA DE VUELTA Y ESTADO ÁNIMO',
      lapTime: 'Tiempo de Vuelta',
      sector1: 'Sector 1',
      sector2: 'Sector 2',
      sector3: 'Sector 3',
      tyreAge: 'Vida del Neumático',
      compound: 'Compuesto'
    }
  },
  nl: {
    header: {
      title: 'STILLE CO-PILOT',
      subtitle: 'AI COCKPIT STUUR CONTROLLER',
      status: 'STUUR DISPLAY ONLINE',
      language: 'Taal'
    },
    viewer3d: {
      title: '3D TELEMETRIE MATRIX',
      subtitle: 'Live Aero & Thermisch Model (Interactief 360°)',
      livery: 'Kleurenschema:',
      model: 'Model:',
      cameraView: 'Camerabeeld:',
      orbit: '360° Orbit',
      cockpit: 'Cockpit',
      frontAero: 'Voorvleugel Aero',
      rearDrs: 'Achtervleugel DRS',
      sideAero: 'Zijwaartse Aero',
      pauseRotation: 'Pauzeer Rotatie',
      playRotation: 'Hervat Rotatie',
      wireframe: 'Draadmodel',
      loading: 'F1 MATERIALEN & KLEUREN AANBRENGEN...'
    },
    driverState: {
      title: 'STATUS COUPEUR',
      stressLevel: 'STRESS NIVEAU',
      fatigue: 'VERMOEIDHEID',
      confidence: 'VERTROUWEN',
      gear: 'VERSNELLING',
      speed: 'SNELHEID',
      lap: 'RONDE',
      delta: 'DELTA',
      nominal: 'NORMAAL',
      caution: 'LET OP',
      warning: 'WAARSCHUWING',
      critical: 'KRITIEKE WAARSCHUWING'
    },
    insights: {
      title: 'AI PIT-WALL STRATEGIE',
      subtitle: 'Realtime Beslissingsmotor & Tactiek',
      strategicInsight: 'STRATEGISCH INZICHT',
      tacticalRecommendation: 'TACTISCH ADVIES',
      aiConfidence: 'AI VERTROUWEN',
      alertTriggered: 'KRITIEKE WAARSCHUWING GEACTIVEERD'
    },
    transcript: {
      title: 'RADIO TRANSCRIPTIE',
      driverSpeaker: 'BOORDRADIO (LIVE)',
      emotionState: 'EMOTIONELE STATUS',
      noAudio: 'Geen boordradio geanalyseerd.'
    },
    uploader: {
      demoClips: 'F1 DEMO CLIPS',
      talkLive: 'LIVE PRATEN (MIC)',
      dropAudio: 'Sleep audiobestand of klik om te uploaden',
      supportedFormats: 'WAV, MP3, M4A ondersteund',
      analyzing: 'COUPEUR TELEMETRIE ANALYSEREN...',
      analyzeBtn: 'ANALYSEER TRANSMISSIE',
      recording: 'BOORDRADIO OPNEEMEN...',
      stopRecord: 'STOP & ANALYSEER'
    },
    telemetryChart: {
      title: 'RONDETIJD TELEMETRIE & GEMOEDSTOESTAND',
      lapTime: 'Rondetijd',
      sector1: 'Sector 1',
      sector2: 'Sector 2',
      sector3: 'Sector 3',
      tyreAge: 'Bandenleeftijd',
      compound: 'Samenstelling'
    }
  },
  de: {
    header: {
      title: 'STILLER CO-PILOT',
      subtitle: 'KI-COCKPIT LENKRAD CONTROLLER',
      status: 'LENKRAD DISPLAY ONLINE',
      language: 'Sprache'
    },
    viewer3d: {
      title: '3D-TELEMETRIE MATRIX',
      subtitle: 'Live Aero- & Thermik-Modell (360°)',
      livery: 'Lackierung:',
      model: 'Modell:',
      cameraView: 'Kameraansicht:',
      orbit: '360° Orbit',
      cockpit: 'Cockpit',
      frontAero: 'Frontflügel Aero',
      rearDrs: 'Heckflügel DRS',
      sideAero: 'Seitenflügel Aero',
      pauseRotation: 'Rotation Pausieren',
      playRotation: 'Rotation Starten',
      wireframe: 'Gittermodell',
      loading: 'LADE F1-LACKIERUNG & MATERIALIEN...'
    },
    driverState: {
      title: 'FAHRERZUSTAND',
      stressLevel: 'STRESS-LEVEL',
      fatigue: 'ERMÜDUNG',
      confidence: 'VERTRAUEN',
      gear: 'GANG',
      speed: 'TEMPO',
      lap: 'RUNDE',
      delta: 'DELTA',
      nominal: 'NOMINAL',
      caution: 'VORSICHT',
      warning: 'WARNUNG',
      critical: 'KRITISCHER ALARM'
    },
    insights: {
      title: 'KI PIT-WALL STRATEGIE',
      subtitle: 'Echtzeit Taktik- & Entscheidungssystem',
      strategicInsight: 'STRATEGISCHE ERKENNTNIS',
      tacticalRecommendation: 'TAKTIK-EMPFEHLUNG',
      aiConfidence: 'KI-VERTRAUEN',
      alertTriggered: 'KRITISCHER ALARM AUSGELÖST'
    },
    transcript: {
      title: 'BOXENFUNK TRANSKRIPTION',
      driverSpeaker: 'BOXENFUNK (LIVE)',
      emotionState: 'EMOTIONALER ZUSTAND',
      noAudio: 'Kein Funkspruch analysiert.'
    },
    uploader: {
      demoClips: 'F1 DEMO-CLIPS',
      talkLive: 'LIVE SPRECHEN (MIKRO)',
      dropAudio: 'Audiodatei hierher ziehen oder klicken',
      supportedFormats: 'WAV, MP3, M4A unterstützt',
      analyzing: 'FAHRER-TELEMETRIE WIRD ANALYSIERT...',
      analyzeBtn: 'FUNKSPRUCH ANALYSIEREN',
      recording: 'BOXENFUNK WIRD AUFGENOMMEN...',
      stopRecord: 'STOPP & ANALYSIEREN'
    },
    telemetryChart: {
      title: 'RUNDEN-TELEMETRIE & FAHRER-STIMMUNG',
      lapTime: 'Rundenzeit',
      sector1: 'Sektor 1',
      sector2: 'Sektor 2',
      sector3: 'Sektor 3',
      tyreAge: 'Reifenalter',
      compound: 'Mischung'
    }
  },
  fr: {
    header: {
      title: 'CO-PILOTE SILENCIEUX',
      subtitle: 'VOLANT DE VOLTIGE A.I.',
      status: 'AFFICHAGE DU VOLANT EN LIGNE',
      language: 'Langue'
    },
    viewer3d: {
      title: 'MATRICE TÉLÉMÉTRIQUE 3D',
      subtitle: 'Modèle Aéro & Thermique Live (360°)',
      livery: 'Livrée:',
      model: 'Modèle:',
      cameraView: 'Vue Caméra:',
      orbit: 'Orbitale 360°',
      cockpit: 'Cockpit',
      frontAero: 'Aéro Avant',
      rearDrs: 'DRS Arrière',
      sideAero: 'Aéro Latéral',
      pauseRotation: 'Mettre en Pause',
      playRotation: 'Lancer Rotation',
      wireframe: 'Maillage Fil de Fer',
      loading: 'APPLICATION DE LA LIVRÉE F1...'
    },
    driverState: {
      title: 'ÉTAT DU PILOTE',
      stressLevel: 'NIVEAU DE STRESS',
      fatigue: 'FATIGUE',
      confidence: 'CONFIANCE',
      gear: 'RAPPORT',
      speed: 'VITESSE',
      lap: 'TOUR',
      delta: 'DELTA',
      nominal: 'NOMINAL',
      caution: 'ATTENTION',
      warning: 'AVERTISSEMENT',
      critical: 'ALERTE CRITIQUE'
    },
    insights: {
      title: 'STRATÉGIE STANDS I.A.',
      subtitle: 'Moteur TACTIQUE & Prise de Décision Live',
      strategicInsight: 'ANALYSE STRATÉGIQUE',
      tacticalRecommendation: 'RECOMMANDATION TACTIQUE',
      aiConfidence: 'CONFIANCE I.A.',
      alertTriggered: 'ALERTE CRITIQUE DÉCLENCHÉE'
    },
    transcript: {
      title: 'TRANSCRIPTION RADIO',
      driverSpeaker: 'RADIO PILOTE (EN DIRECT)',
      emotionState: 'ÉTAT ÉMOTIONNEL',
      noAudio: 'Aucune transmission radio analysée.'
    },
    uploader: {
      demoClips: 'CLIPS DÉMO F1',
      talkLive: 'PARLER EN DIRECT (MIC)',
      dropAudio: 'Déposer le fichier audio ou cliquer pour envoyer',
      supportedFormats: 'WAV, MP3, M4A supportés',
      analyzing: 'ANALYSE TÉLÉMÉTRIE PILOTE EN COURS...',
      analyzeBtn: 'ANALYSER LA TRANSMISSION',
      recording: 'ENREGISTREMENT RADIO PILOTE...',
      stopRecord: 'STOPPER & ANALYSER'
    },
    telemetryChart: {
      title: 'TÉLÉMÉTRIE DE TOUR & SUIVI D\'HUMEUR',
      lapTime: 'Temps au Tour',
      sector1: 'Secteur 1',
      sector2: 'Secteur 2',
      sector3: 'Secteur 3',
      tyreAge: 'Âge des Pneus',
      compound: 'Gomme'
    }
  }
}
