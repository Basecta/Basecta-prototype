'use client';

import { useState, useRef } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadIcon, FileIcon, XIcon } from 'lucide-react';

interface AddFarmData {
  name: string;
  area: string;
  county: string;
  size: string;
  folioPdf: File | null;
}

interface AddFarmDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddFarmData) => void;
}

const STEPS = [
  { title: 'Farm Name', description: 'What is the name of your farm?' },
  { title: 'Location', description: 'Where is your farm located?' },
  { title: 'Farm Size', description: 'What is the approximate size of your farm?' },
  { title: 'Folio Upload', description: 'Upload your folio PDF document.' },
];

export function AddFarmDrawer({ open, onOpenChange, onSubmit }: AddFarmDrawerProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<AddFarmData>({
    name: '',
    area: '',
    county: '',
    size: '',
    folioPdf: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStep(0);
    setFormData({ name: '', area: '', county: '', size: '', folioPdf: null });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = () => {
    onSubmit(formData);
    handleOpenChange(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData((prev) => ({ ...prev, folioPdf: file }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, folioPdf: file }));
    }
    e.target.value = '';
  };

  const isNextDisabled =
    (step === 0 && !formData.name.trim()) ||
    (step === 1 && (!formData.area.trim() || !formData.county.trim())) ||
    (step === 2 && !formData.size.trim());

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === step ? 'bg-primary' : i < step ? 'bg-primary/40' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <DrawerTitle>{STEPS[step].title}</DrawerTitle>
            <DrawerDescription>{STEPS[step].description}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 py-4">
            {/* Step 1: Farm Name */}
            {step === 0 && (
              <div className="space-y-2">
                <Label htmlFor="farm-name">Farm Name</Label>
                <Input
                  id="farm-name"
                  placeholder="e.g. Green Valley Farm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
            )}

            {/* Step 2: Location */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="farm-area">Area</Label>
                  <Input
                    id="farm-area"
                    placeholder="e.g. Lismore"
                    value={formData.area}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, area: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farm-county">County</Label>
                  <Input
                    id="farm-county"
                    placeholder="e.g. Tipperary"
                    value={formData.county}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, county: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 3: Farm Size */}
            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="farm-size">Approximate Size (acres)</Label>
                <div className="relative">
                  <Input
                    id="farm-size"
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, size: e.target.value }))
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    acres
                  </span>
                </div>
              </div>
            )}

            {/* Step 4: Folio PDF Upload */}
            {step === 3 && (
              <div className="space-y-2">
                <Label>Folio PDF</Label>
                {formData.folioPdf ? (
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <FileIcon className="size-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formData.folioPdf.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(formData.folioPdf.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, folioPdf: null }))
                      }
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent"
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <UploadIcon className="size-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      PDF files only
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DrawerFooter>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext} disabled={isNextDisabled} className="flex-1">
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1">
                  Add Farm
                </Button>
              )}
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
