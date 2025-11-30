import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TutorialField, TutorialStep } from '@/types/tutorial';
import { HelpCircle } from 'lucide-react';

interface StepFormProps {
  step: TutorialStep;
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
}

export default function StepForm({ step, values, onChange }: StepFormProps) {
  const renderField = (field: TutorialField) => {
    const value = values[field.name] ?? field.defaultValue ?? '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="mt-2"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(field.name, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            className="mt-2"
            min={0}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => onChange(field.name, val)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'toggle':
        return (
          <div className="flex items-center gap-3 mt-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => onChange(field.name, checked)}
            />
            <span className="text-sm text-gray-600">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {step.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={field.name} className="text-base font-semibold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">{field.helpText}</p>
                    {field.example && (
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold">Example:</span> {field.example}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {renderField(field)}

          <p className="text-sm text-gray-500">{field.helpText}</p>
          {field.example && (
            <p className="text-xs text-gray-400">
              Example: <code className="px-1 rounded">{field.example}</code>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
