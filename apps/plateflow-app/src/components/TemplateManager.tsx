import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Move,
  Maximize2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { PlateTemplate } from '../types';
import { ImageComposerService } from '../services/imageComposerService';
import { Button, Input, Card, Badge, PageHeader } from './ui';

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
      name: 'Novo Modelo',
      description: '',
      backgroundUrl: selectedTemplate?.backgroundUrl || '',
      backgroundWidth: 1200,
      backgroundHeight: 1600,
      qrX: 380,
      qrY: 480,
      qrSize: 440,
      createdAt: new Date().toISOString()
    };
    setSelectedTemplate(newTmpl);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PlateTemplate = {
      id: selectedTemplate?.id || `tmpl-${Date.now()}`,
      name: name.trim() || 'Modelo Sem Nome',
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
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header */}
      <PageHeader
        title="Modelos de Impressão"
        description="Design base e posicionamento do QR Code para a gráfica."
        badge={
          <Badge variant="neutral" size="sm">
            {templates.length} {templates.length === 1 ? 'modelo' : 'modelos'}
          </Badge>
        }
        actions={
          <Button
            id="btn-create-template"
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={handleCreateNew}
          >
            Criar Modelo
          </Button>
        }
      />

      {/* Available templates cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {templates.map((tmpl) => {
          const isSelected = selectedTemplate?.id === tmpl.id;
          return (
            <div
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl)}
              className={`p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between text-left ${
                isSelected
                  ? 'bg-zinc-900 border-zinc-400 ring-1 ring-zinc-400'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-xs text-zinc-100 truncate">
                    {tmpl.name}
                  </h3>
                  {isSelected && (
                    <Badge variant="neutral" size="sm">
                      Ativo
                    </Badge>
                  )}
                </div>
                {tmpl.description && (
                  <p className="text-xs text-zinc-300 mt-1 line-clamp-2">
                    {tmpl.description}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800 text-xs text-zinc-400 font-mono">
                {tmpl.backgroundWidth}×{tmpl.backgroundHeight} px
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-zinc-300" />
                  <span className="text-xs font-semibold text-zinc-200">
                    Posição do QR Code
                  </span>
                </div>
                {templates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteTemplate(selectedTemplate.id)}
                    className="text-zinc-400 hover:text-rose-400 transition-colors p-1 rounded hover:bg-zinc-800 cursor-pointer"
                    title="Excluir modelo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            }
          >
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                id="input-template-name"
                label="Nome do Modelo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Placa 15x20cm"
                required
              />

              {/* Background Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200">
                    Imagem Base
                  </label>
                  <span className="text-xs text-zinc-400 font-mono">
                    {backgroundWidth}×{backgroundHeight}px
                  </span>
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-4 hover:border-zinc-500 transition-colors cursor-pointer text-center"
                >
                  <Upload className="h-5 w-5 text-zinc-300 mb-1" />
                  <span className="text-xs text-zinc-200 font-medium">
                    Subir nova imagem
                  </span>
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
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Move className="h-3.5 w-3.5 text-zinc-300" />
                    <span>Posição X</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono text-zinc-200">
                    <input
                      type="number"
                      value={qrX}
                      min={0}
                      max={backgroundWidth - qrSize}
                      onChange={(e) => setQrX(Number(e.target.value))}
                      className="w-16 rounded-md border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-center text-xs text-zinc-100 font-semibold"
                    />
                    <span className="text-zinc-400">px</span>
                  </div>
                </div>
                <input
                  id="slider-qr-x"
                  type="range"
                  min={0}
                  max={backgroundWidth - qrSize}
                  value={qrX}
                  onChange={(e) => setQrX(Number(e.target.value))}
                  className="w-full accent-zinc-100 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
              </div>

              {/* Coordinate Y Slider and Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Move className="h-3.5 w-3.5 text-zinc-300" />
                    <span>Posição Y</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono text-zinc-200">
                    <input
                      type="number"
                      value={qrY}
                      min={0}
                      max={backgroundHeight - qrSize}
                      onChange={(e) => setQrY(Number(e.target.value))}
                      className="w-16 rounded-md border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-center text-xs text-zinc-100 font-semibold"
                    />
                    <span className="text-zinc-400">px</span>
                  </div>
                </div>
                <input
                  id="slider-qr-y"
                  type="range"
                  min={0}
                  max={backgroundHeight - qrSize}
                  value={qrY}
                  onChange={(e) => setQrY(Number(e.target.value))}
                  className="w-full accent-zinc-100 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
              </div>

              {/* Size Slider and Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5 text-zinc-300" />
                    <span>Tamanho</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono text-zinc-200">
                    <input
                      type="number"
                      value={qrSize}
                      min={100}
                      max={Math.min(backgroundWidth, backgroundHeight)}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="w-16 rounded-md border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-center text-xs text-zinc-100 font-semibold"
                    />
                    <span className="text-zinc-400">px</span>
                  </div>
                </div>
                <input
                  id="slider-qr-size"
                  type="range"
                  min={100}
                  max={Math.min(backgroundWidth, backgroundHeight)}
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full accent-zinc-100 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
              </div>

              {/* Center Horizontally button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setQrX(Math.round((backgroundWidth - qrSize) / 2));
                }}
              >
                Centralizar Horizontalmente
              </Button>

              {/* Save Button */}
              <div className="pt-2">
                <Button
                  id="btn-save-template-form"
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Salvar Modelo
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Live Visual Canvas Column (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-zinc-300" />
                  <span className="text-xs font-semibold text-zinc-200">
                    Pré-visualização
                  </span>
                </div>
                {isGeneratingPreview && (
                  <Badge variant="neutral" size="sm" dot>
                    Atualizando
                  </Badge>
                )}
              </div>
            }
          >
            <div className="flex flex-col items-center justify-center p-2 min-h-[400px]">
              {previewDataUrl ? (
                <div className="relative max-w-xs sm:max-w-sm rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 shadow-sm">
                  <img
                    src={previewDataUrl}
                    alt="Arte do Modelo"
                    className="w-full h-auto object-contain select-none"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-300 mb-2" />
                  <p className="text-xs text-zinc-300 font-medium">Gerando visualização...</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
