import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Sparkles,
  Move,
  Maximize2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { PlateTemplate } from '../types';
import { ImageComposerService } from '../services/imageComposerService';

interface TemplateManagerProps {
  templates: PlateTemplate[];
  onSaveTemplate: (template: PlateTemplate) => void;
  onDeleteTemplate: (id: string) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onSaveTemplate,
  onDeleteTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PlateTemplate>(templates[0]);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState(selectedTemplate?.name || '');
  const [description, setDescription] = useState(selectedTemplate?.description || '');
  const [backgroundUrl, setBackgroundUrl] = useState(selectedTemplate?.backgroundUrl || '');
  const [backgroundWidth, setBackgroundWidth] = useState(selectedTemplate?.backgroundWidth || 1200);
  const [backgroundHeight, setBackgroundHeight] = useState(selectedTemplate?.backgroundHeight || 1600);
  const [qrX, setQrX] = useState(selectedTemplate?.qrX || 380);
  const [qrY, setQrY] = useState(selectedTemplate?.qrY || 480);
  const [qrSize, setQrSize] = useState(selectedTemplate?.qrSize || 440);

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep state synchronized when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      setName(selectedTemplate.name);
      setDescription(selectedTemplate.description);
      setBackgroundUrl(selectedTemplate.backgroundUrl);
      setBackgroundWidth(selectedTemplate.backgroundWidth);
      setBackgroundHeight(selectedTemplate.backgroundHeight);
      setQrX(selectedTemplate.qrX);
      setQrY(selectedTemplate.qrY);
      setQrSize(selectedTemplate.qrSize);
    }
  }, [selectedTemplate]);

  // Update live preview whenever coordinates or template changes
  useEffect(() => {
    let active = true;
    const generate = async () => {
      if (!backgroundUrl) return;
      setIsGeneratingPreview(true);
      try {
        const dummyTemplate: PlateTemplate = {
          id: selectedTemplate?.id || 'temp',
          name,
          description,
          backgroundUrl,
          backgroundWidth,
          backgroundHeight,
          qrX,
          qrY,
          qrSize,
          createdAt: ''
        };
        const result = await ImageComposerService.composePlate(
          dummyTemplate,
          'https://exemplo.com/r/demo-sample',
          'DEMO-01'
        );
        if (active) setPreviewDataUrl(result);
      } catch (err) {
        console.error('Error generating preview', err);
      } finally {
        if (active) setIsGeneratingPreview(false);
      }
    };

    const timer = setTimeout(generate, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [backgroundUrl, qrX, qrY, qrSize, backgroundWidth, backgroundHeight]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setBackgroundUrl(dataUrl);
        setBackgroundWidth(img.naturalWidth || 1200);
        setBackgroundHeight(img.naturalHeight || 1600);
        // Center QR code by default
        const calculatedSize = Math.round(img.naturalWidth * 0.35);
        const calculatedX = Math.round((img.naturalWidth - calculatedSize) / 2);
        const calculatedY = Math.round(img.naturalHeight * 0.3);
        setQrSize(calculatedSize);
        setQrX(calculatedX);
        setQrY(calculatedY);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNew = () => {
    const newTmpl: PlateTemplate = {
      id: `tmpl-${Date.now()}`,
      name: 'Novo Template de Placa',
      description: 'Template personalizado com carimbo automático de QR Code.',
      backgroundUrl: selectedTemplate.backgroundUrl,
      backgroundWidth: 1200,
      backgroundHeight: 1600,
      qrX: 380,
      qrY: 480,
      qrSize: 440,
      createdAt: new Date().toISOString()
    };
    setSelectedTemplate(newTmpl);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PlateTemplate = {
      id: selectedTemplate?.id || `tmpl-${Date.now()}`,
      name: name.trim() || 'Template Sem Nome',
      description: description.trim(),
      backgroundUrl,
      backgroundWidth: Number(backgroundWidth) || 1200,
      backgroundHeight: Number(backgroundHeight) || 1600,
      qrX: Number(qrX) || 0,
      qrY: Number(qrY) || 0,
      qrSize: Number(qrSize) || 400,
      createdAt: selectedTemplate?.createdAt || new Date().toISOString()
    };
    onSaveTemplate(updated);
    setSelectedTemplate(updated);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Templates selection pill list */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <span>Gerenciador de Templates &amp; Mapeamento Visual</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Faça upload do design base da placa e configure com precisão milimétrica a posição (X, Y) e tamanho do QR Code.
          </p>
        </div>

        <button
          id="btn-create-template"
          onClick={handleCreateNew}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Criar Novo Template</span>
        </button>
      </div>

      {/* Available templates cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {templates.map((tmpl) => {
          const isSelected = selectedTemplate?.id === tmpl.id;
          return (
            <div
              key={tmpl.id}
              onClick={() => {
                setSelectedTemplate(tmpl);
                setIsEditing(false);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs text-white truncate max-w-[200px]">
                    {tmpl.name}
                  </h3>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Selecionado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {tmpl.description || 'Sem descrição.'}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{tmpl.backgroundWidth}x{tmpl.backgroundHeight} px</span>
                <span className="font-mono text-indigo-300">X:{tmpl.qrX} Y:{tmpl.qrY} S:{tmpl.qrSize}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Studio Area: Editor Controls on Left, Live Composition Canvas on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <span>Calibração do Carimbo do QR Code</span>
              </h3>
              {templates.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(selectedTemplate.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  title="Excluir este template"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Template Name & Description */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nome do Modelo</label>
                <input
                  id="input-template-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Placa Google Reviews 15x20cm"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Descrição / Finalidade</label>
                <input
                  id="input-template-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Placa de acrílico para balcão ou mesas"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Background Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Imagem Base de Fundo (PNG / SVG)</span>
                <span className="text-[10px] text-slate-400">Resolução: {backgroundWidth}x{backgroundHeight}px</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3 hover:border-indigo-500 transition-colors cursor-pointer"
              >
                <Upload className="h-5 w-5 text-indigo-400" />
                <span className="text-xs font-medium text-slate-300 mt-1">Clique para subir nova arte</span>
                <span className="text-[10px] text-slate-400">Suporta PNG ou SVG em alta resolução da IA ou Photoshop</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Coordinate X Slider and Number */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Move className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Posição Horizontal (Eixo X)</span>
                </span>
                <div className="flex items-center gap-1 font-mono text-cyan-300">
                  <input
                    type="number"
                    value={qrX}
                    min={0}
                    max={backgroundWidth - qrSize}
                    onChange={(e) => setQrX(Number(e.target.value))}
                    className="w-16 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-center text-xs"
                  />
                  <span>px</span>
                </div>
              </div>
              <input
                id="slider-qr-x"
                type="range"
                min={0}
                max={backgroundWidth - qrSize}
                value={qrX}
                onChange={(e) => setQrX(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Coordinate Y Slider and Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Move className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Posição Vertical (Eixo Y)</span>
                </span>
                <div className="flex items-center gap-1 font-mono text-indigo-300">
                  <input
                    type="number"
                    value={qrY}
                    min={0}
                    max={backgroundHeight - qrSize}
                    onChange={(e) => setQrY(Number(e.target.value))}
                    className="w-16 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-center text-xs"
                  />
                  <span>px</span>
                </div>
              </div>
              <input
                id="slider-qr-y"
                type="range"
                min={0}
                max={backgroundHeight - qrSize}
                value={qrY}
                onChange={(e) => setQrY(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Size Slider and Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
                  <span>Dimensão do Quadrado (Tamanho)</span>
                </span>
                <div className="flex items-center gap-1 font-mono text-amber-300">
                  <input
                    type="number"
                    value={qrSize}
                    min={100}
                    max={Math.min(backgroundWidth, backgroundHeight)}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-16 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-center text-xs"
                  />
                  <span>px</span>
                </div>
              </div>
              <input
                id="slider-qr-size"
                type="range"
                min={100}
                max={Math.min(backgroundWidth, backgroundHeight)}
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Center Automatically button */}
            <button
              type="button"
              onClick={() => {
                setQrX(Math.round((backgroundWidth - qrSize) / 2));
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Centralizar QR Code Horizontalmente
            </button>

            {/* Save Button */}
            <button
              id="btn-save-template-form"
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Salvar Parâmetros do Modelo</span>
            </button>
          </form>
        </div>

        {/* Live Visual Canvas Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl relative min-h-[500px]">
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-1.5 border border-slate-800 text-xs text-slate-300">
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>Simulação da Composição em Alta Resolução</span>
          </div>

          {isGeneratingPreview && (
            <div className="absolute top-4 right-4 text-[11px] font-mono text-indigo-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Renderizando...</span>
            </div>
          )}

          {previewDataUrl ? (
            <div className="relative group max-w-xs sm:max-w-sm rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 my-4">
              <img
                src={previewDataUrl}
                alt="Arte Final da Placa"
                className="w-full h-auto object-contain select-none"
              />
              <div className="absolute bottom-2 right-2 rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 text-[10px] text-slate-300 font-mono">
                {backgroundWidth}x{backgroundHeight}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 py-12">
              <Sparkles className="h-8 w-8 animate-spin" />
              <p className="text-xs mt-2">Carregando preview da arte...</p>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center max-w-md mt-2">
            Este é o resultado idêntico ao que será gravado em cada arquivo PNG no lote de 50 unidades enviado para a gráfica.
          </p>
        </div>
      </div>
    </div>
  );
};
