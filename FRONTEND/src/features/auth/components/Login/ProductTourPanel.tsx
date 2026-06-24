import React from 'react';
import {
  PRODUCT_TOUR_HEADLINE,
  PRODUCT_TOUR_LEAD,
  PRODUCT_TOUR_STEPS,
} from '../../config/demoAccounts.config';

type ProductTourPanelProps = {
  variant?: 'hero' | 'compact';
  surface?: 'dark' | 'light';
};

const ProductTourPanel: React.FC<ProductTourPanelProps> = ({
  variant = 'hero',
  surface = 'dark',
}) => {
  const isHero = variant === 'hero';
  const isLight = surface === 'light';

  return (
    <div className={isHero ? 'space-y-8' : 'space-y-5'}>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#e94560] mb-4">
          How it works
        </p>
        <h2
          className={`font-medium leading-snug ${
            isLight ? 'text-slate-800' : 'text-slate-100'
          } ${isHero ? 'text-[22px]' : 'text-lg'}`}
        >
          {PRODUCT_TOUR_HEADLINE}
        </h2>
        <p
          className={`mt-2.5 leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          } ${isHero ? 'text-[13px]' : 'text-xs'}`}
        >
          {PRODUCT_TOUR_LEAD}
        </p>
      </div>

      <ol className={`flex flex-col ${isHero ? 'gap-5' : 'gap-4'}`}>
        {PRODUCT_TOUR_STEPS.map((item) => (
          <li key={item.step} className="flex gap-3.5 items-start">
            <span
              className={`shrink-0 flex items-center justify-center rounded-full bg-[#e94560] text-white font-medium ${
                isHero ? 'h-[26px] w-[26px] text-[11px] mt-px' : 'h-6 w-6 text-[10px]'
              }`}
            >
              {item.step}
            </span>
            <div>
              <p
                className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'} ${
                  isHero ? 'text-[13px]' : 'text-xs'
                }`}
              >
                {item.title}
              </p>
              <p
                className={`mt-0.5 leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                } ${isHero ? 'text-xs' : 'text-[11px]'}`}
              >
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ProductTourPanel;
