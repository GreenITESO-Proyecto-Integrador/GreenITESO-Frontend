import { Typography } from './sections/Typography';
import { ColorPalette } from './sections/ColorPalette';
import { SemanticStates } from './sections/SemanticStates';
import { EnvironmentalImpact } from './sections/EnvironmentalImpact';
import { ButtonShowcase } from './sections/ButtonShowcase';
import { FormShowcase } from './sections/FormShowcase';
import { CardShowcase } from './sections/CardShowcase';
import { BadgeShowcase } from './sections/BadgeShowcase';
import { BottomNavigation } from './sections/BottomNavigation';

export function DesignSystemPage() {
  return (
    <div className="bg-secondary-50 min-h-screen pb-28">
      {/* Hero Section */}
      <div className="bg-linear-to-b from-primary-500 to-primary-600 text-white text-center px-4 py-8 sm:py-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">GreenITESO</h1>
        <p className="text-primary-100 text-lg sm:text-xl">Sistema de Diseño</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        <Typography />
        <ColorPalette
          title="Paleta Primaria - Verde Ecológico"
          colorPrefix="primary"
          borderClass="border border-secondary-100"
        />
        <ColorPalette
          title="Paleta Secundaria - Gris Salvia"
          colorPrefix="secondary"
          borderClass="border border-secondary-200"
        />
        <SemanticStates />
        <EnvironmentalImpact />
        <ButtonShowcase />
        <FormShowcase />
        <CardShowcase />
        <BadgeShowcase />
      </div>

      <BottomNavigation />
    </div>
  );
}

export default DesignSystemPage;
