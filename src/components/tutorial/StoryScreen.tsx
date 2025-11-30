import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TutorialScenarioDefinition, TutorialState } from '@/types/tutorial';
import { simpleWebAppScenario } from '@/utils/tutorialScenarios';
import { Check, ChevronLeft, ChevronRight, GraduationCap, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepForm from './StepForm';
import YamlPreview from './YamlPreview';

export default function StoryScreen() {
  const navigate = useNavigate();
  const [scenario] = useState<TutorialScenarioDefinition>(simpleWebAppScenario);
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    currentStepIndex: 0,
    completedSteps: new Set(),
    formData: {}
  });

  const currentStep = scenario.steps[tutorialState.currentStepIndex];
  const progress = ((tutorialState.completedSteps.size) / scenario.steps.length) * 100;
  const isLastStep = tutorialState.currentStepIndex === scenario.steps.length - 1;
  const isFirstStep = tutorialState.currentStepIndex === 0;

  // Initialize default values for current step
  useEffect(() => {
    if (!tutorialState.formData[currentStep.id]) {
      const defaultValues: Record<string, any> = {};
      currentStep.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaultValues[field.name] = field.defaultValue;
        }
      });

      if (Object.keys(defaultValues).length > 0) {
        setTutorialState(prev => ({
          ...prev,
          formData: {
            ...prev.formData,
            [currentStep.id]: defaultValues
          }
        }));
      }
    }
  }, [currentStep.id]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setTutorialState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [currentStep.id]: {
          ...prev.formData[currentStep.id],
          [fieldName]: value
        }
      }
    }));
  };

  const validateCurrentStep = (): boolean => {
    const stepData = tutorialState.formData[currentStep.id] || {};
    const requiredFields = currentStep.fields.filter(f => f.required);

    return requiredFields.every(field => {
      // Get value from form data or fall back to default value
      const value = stepData[field.name] ?? field.defaultValue;

      if (field.type === 'number') {
        return value !== undefined && value !== null && value > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    // Mark current step as completed
    const newCompleted = new Set(tutorialState.completedSteps);
    newCompleted.add(currentStep.id);

    if (isLastStep) {
      // Tutorial complete
      setTutorialState(prev => ({
        ...prev,
        completedSteps: newCompleted
      }));
    } else {
      // Move to next step
      setTutorialState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1,
        completedSteps: newCompleted
      }));
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setTutorialState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1
      }));
    }
  };

  const handleComplete = () => {
    // Navigate to main builder with the generated resources
    navigate('/', { state: { tutorialData: tutorialState.formData } });
  };

  const isStepCompleted = tutorialState.completedSteps.has(currentStep.id);
  const canProceed = validateCurrentStep();
  const allStepsCompleted = tutorialState.completedSteps.size === scenario.steps.length;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">{scenario.title}</h1>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Exit Tutorial
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: Step {tutorialState.currentStepIndex + 1} of {scenario.steps.length}
            </span>
            <span className="text-sm text-gray-500">{scenario.duration}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-6 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Step Form */}
            <Card className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Step Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isStepCompleted ? 'bg-green-500' : 'bg-indigo-600'
                        }`}>
                        {isStepCompleted ? <Check className="h-6 w-6" /> : tutorialState.currentStepIndex + 1}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-200">{currentStep.title}</h2>
                    </div>
                    <p className="text-gray-400 ml-13">{currentStep.description}</p>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">What is a {currentStep.resourceType}?</h3>
                  <p className="text-sm text-blue-800">{currentStep.explanation}</p>
                </div>

                {/* ELI5 Section */}
                {currentStep.eli5 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <span className="text-lg">🧒</span>
                      Explain Like I'm 5
                    </h3>
                    <p className="text-sm text-purple-800 italic">{currentStep.eli5}</p>
                  </div>
                )}

                {/* Tips */}
                {currentStep.tips && currentStep.tips.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-2">Tips:</h3>
                    <ul className="space-y-1">
                      {currentStep.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Form Fields */}
                <StepForm
                  step={currentStep}
                  values={tutorialState.formData[currentStep.id] || {}}
                  onChange={handleFieldChange}
                />

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isFirstStep}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  {allStepsCompleted ? (
                    <Button
                      onClick={handleComplete}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      Complete & Build
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed}
                      className="flex items-center gap-2"
                    >
                      {isLastStep ? 'Finish' : 'Next Step'}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {!canProceed && (
                  <p className="text-sm text-amber-600 text-center">
                    Please fill all required fields to continue
                  </p>
                )}
              </div>
            </Card>

            {/* Right: YAML Preview */}
            <YamlPreview
              formData={tutorialState.formData}
              currentStepId={currentStep.id}
              completedSteps={tutorialState.completedSteps}
            />
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="bg-white border-t px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            {scenario.steps.map((step, idx) => {
              const isCompleted = tutorialState.completedSteps.has(step.id);
              const isCurrent = idx === tutorialState.currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all ${isCompleted ? 'bg-green-500' :
                    isCurrent ? 'bg-indigo-600' :
                      'bg-gray-200'
                    }`}
                  title={step.title}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
