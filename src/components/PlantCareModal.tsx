import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Sprout, Droplets, Sun, Wind, Thermometer, ShieldAlert, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { PlantCareResult } from '../types/yuki';

interface PlantCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'km' | 'en';
}

const SAMPLE_PLANTS = [
  {
    name: 'Money Tree (Pachira aquatica)',
    url: 'https://images.unsplash.com/photo-1599818451121-6f4a478b86e8?auto=format&fit=crop&w=600&q=80',
    prompt: 'Identify this Money Tree and provide full care instructions and lucky Yuki lottery connection.',
  },
  {
    name: 'Snake Plant (Sansevieria)',
    url: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bf6?auto=format&fit=crop&w=600&q=80',
    prompt: 'Identify this Snake plant and provide care instructions and lucky Yuki connection.',
  },
  {
    name: 'Jade Plant (Crassula ovata)',
    url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80',
    prompt: 'Identify this Jade succulent plant and provide care instructions.',
  },
  {
    name: 'Peace Lily (Spathiphyllum)',
    url: 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=600&q=80',
    prompt: 'Identify this Peace Lily and provide care instructions.',
  },
];

export const PlantCareModal: React.FC<PlantCareModalProps> = ({ isOpen, onClose, lang }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_PLANTS[0].url);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PlantCareResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Convert image URL to base64 for sample images
  const urlToBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setImageBase64(base64);
        setAnalysisResult(null);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_PLANTS[0]) => {
    setSelectedImage(sample.url);
    setImageBase64(null);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setErrorMsg(null);

    try {
      let b64 = imageBase64;
      if (!b64 && selectedImage.startsWith('http')) {
        b64 = await urlToBase64(selectedImage);
      }

      if (!b64) {
        b64 = selectedImage;
      }

      const response = await fetch('/api/identify-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: b64,
          mimeType: 'image/jpeg',
          prompt: 'Identify this plant accurately, diagnose health, provide step-by-step care instructions, and determine its lucky Yuki 12 number connection.',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to analyze plant image');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Sprout className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                {lang === 'km' ? 'កម្មវិធីជំនួយថែទាំរុក្ខជាតិ & AI' : 'FloraBot Plant Care & Identification'}
              </h2>
              <p className="text-xs text-emerald-100">
                {lang === 'km'
                  ? 'ស្កេនរូបថតរុក្ខជាតិដើម្បីស្គាល់ប្រភេទ និងទទួលការណែនាំថែទាំលម្អិត'
                  : 'Identify plants from photos with Gemini 4 Argon & get custom care guides'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Photo Upload & Samples */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {/* Image Preview Box */}
            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col items-center justify-center group shadow-inner">
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Plant to analyze"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'km' ? 'ប្តូររូបថត' : 'Change Photo'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    {lang === 'km' ? 'ទម្លាក់រូបថតរុក្ខជាតិនៅទីនេះ' : 'Upload or drop a plant photo'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? 'បញ្ចូលរូបថតផ្ទាល់ខ្លួន' : 'Upload Photo'}</span>
              </button>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || !selectedImage}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-3 rounded-lg shadow transition flex items-center justify-center gap-1.5"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'km' ? 'កំពុងវិភាគ...' : 'Analyzing...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{lang === 'km' ? 'វិភាគរុក្ខជាតិ' : 'Identify & Care'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Photos */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                {lang === 'km' ? 'ឬសាកល្បងរូបរុក្ខជាតិសំណាងគំរូ:' : 'Or choose sample lucky plant:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PLANTS.map((sample, idx) => (
                  <button
                    key={`sample-${idx}`}
                    onClick={() => handleSelectSample(sample)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition ${
                      selectedImage === sample.url
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-800 line-clamp-1">
                        {sample.name.split('(')[0]}
                      </span>
                      <span className="text-[9px] text-emerald-700 block">
                        Lucky #{idx === 0 ? 8 : idx === 1 ? 3 : idx === 2 ? 4 : 7}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis & Care Instructions */}
          <div className="md:col-span-7 flex flex-col justify-start">
            {analyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3 text-emerald-600 animate-pulse">
                  <Sprout className="w-8 h-8 animate-bounce" />
                </div>
                <h3 className="font-extrabold text-base text-slate-800">
                  {lang === 'km' ? 'Gemini 4 Argon កំពុងពិនិត្យស្លឹក និងប្រភេទរុក្ខជាតិ...' : 'Gemini AI Vision analyzing botanical features...'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Detecting leaf morphology, species classification, health diagnostics, and hydration needs.
                </p>
              </div>
            ) : analysisResult ? (
              <div className="flex flex-col gap-3 animate-in fade-in">
                {/* Plant Name Card */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900 leading-tight">
                          {analysisResult.name}
                        </h3>
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {Math.round(analysisResult.confidence * 100)}% Match
                        </span>
                      </div>
                      <p className="text-xs italic text-emerald-800 font-mono mt-0.5">
                        {analysisResult.scientificName} • {analysisResult.family}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {analysisResult.description}
                  </p>
                </div>

                {/* Lucky Yuki Connection Card */}
                {analysisResult.luckyYukiConnection && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-blue-950 font-black text-lg flex items-center justify-center border-2 border-yellow-200 shadow-sm font-mono">
                        {analysisResult.luckyYukiConnection.number}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-amber-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>{lang === 'km' ? 'ទំនាក់ទំនងលេខសំណាង យូគី ១២:' : 'Lucky Yuki 12 Resonance:'}</span>
                          <span className="text-blue-900 font-bold">
                            {analysisResult.luckyYukiConnection.animal} ({analysisResult.luckyYukiConnection.color})
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          {analysisResult.luckyYukiConnection.meaning}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Care Instructions Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Watering */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 mb-1">
                      <Droplets className="w-4 h-4" />
                      <span>{lang === 'km' ? 'កាលវិភាគស្រោចទឹក' : 'Watering Schedule'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analysisResult.careInstructions.watering}
                    </p>
                  </div>

                  {/* Sunlight */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
                      <Sun className="w-4 h-4" />
                      <span>{lang === 'km' ? 'តម្រូវការពន្លឺ' : 'Light Requirements'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analysisResult.careInstructions.light}
                    </p>
                  </div>

                  {/* Soil & Drainage */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                      <Wind className="w-4 h-4" />
                      <span>{lang === 'km' ? 'ដី និងជី' : 'Soil & Fertilizer'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analysisResult.careInstructions.soil}
                    </p>
                  </div>

                  {/* Temperature & Humidity */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 mb-1">
                      <Thermometer className="w-4 h-4" />
                      <span>{lang === 'km' ? 'សីតុណ្ហភាព & សំណើម' : 'Temp & Humidity'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {analysisResult.careInstructions.temperature} ({analysisResult.careInstructions.humidity})
                    </p>
                  </div>
                </div>

                {/* Health Assessment & Toxicity */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800">
                        {lang === 'km' ? 'ស្ថានភាពសុខភាព:' : 'Health:'}{' '}
                      </span>
                      <span className="text-slate-600">{analysisResult.healthCheck.diagnosis}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200 text-[11px] text-orange-900">
                  <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>
                    <b>{lang === 'km' ? 'ជាតិពុលសត្វចិញ្ចឹម:' : 'Pet Toxicity:'}</b> {analysisResult.toxicity}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Sprout className="w-12 h-12 text-emerald-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">
                  {lang === 'km' ? 'ជ្រើសរើសរូបថត និងចុច "វិភាគរុក្ខជាតិ"' : 'Select or upload a plant photo, then click Identify'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Provides exact watering frequencies, light settings, leaf diagnosis, and lucky 11x number insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
