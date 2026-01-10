import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useNetwork } from '../Context/NetworkContext';

/**
 * QuickAccessCard - A quick action button card for the dashboard
 * Supports network restriction for specific actions (like Clock In/Out)
 */
function QuickAccessCard({ 
  title, 
  subtitle, 
  icon, 
  path, 
  requiresNetwork = false,
  color = 'bg-gradient-to-br from-blue-500 to-indigo-600'
}) {
  const navigate = useNavigate();
  const { isLocal, checking } = useNetwork() || {};
  
  // Determine if the card should be disabled
  const isDisabled = requiresNetwork && !isLocal;
  const isLoading = requiresNetwork && checking;
  
  const handleClick = () => {
    if (isDisabled || isLoading) return;
    if (path) navigate(path);
  };
  
  return (
    <div
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-xl p-5 
        transition-all duration-300 ease-out
        ${isDisabled 
          ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' 
          : 'bg-white dark:bg-slate-800 hover:shadow-lg hover:scale-[1.02] cursor-pointer shadow dark:shadow-slate-900'
        }
        group
      `}
    >
      {/* Background gradient accent */}
      <div className={`
        absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20
        ${isDisabled ? 'bg-gray-400' : 'bg-blue-500'}
        transition-opacity group-hover:opacity-30
      `} />
      
      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mb-4
        ${isDisabled 
          ? 'bg-gray-200 dark:bg-gray-700' 
          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }
        transition-transform group-hover:scale-110
      `}>
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Icon 
            name={icon || 'Zap'} 
            className={`w-6 h-6 ${isDisabled ? 'text-gray-400' : 'text-white'}`} 
          />
        )}
      </div>
      
      {/* Content */}
      <h4 className={`
        font-semibold text-base mb-1
        ${isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}
      `}>
        {title}
      </h4>
      
      <p className={`
        text-xs
        ${isDisabled ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}
      `}>
        {isDisabled ? '🔒 Connect to office network' : subtitle}
      </p>
      
      {/* Arrow indicator */}
      {!isDisabled && !isLoading && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
          <Icon name="ArrowRight" className="w-5 h-5 text-blue-500 dark:text-blue-400" />
        </div>
      )}
      
      {/* Network required badge */}
      {requiresNetwork && (
        <div className={`
          absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium
          ${isLocal 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }
        `}>
          {checking ? '...' : isLocal ? 'Office' : 'External'}
        </div>
      )}
    </div>
  );
}

/**
 * QuickAccessGrid - Renders a grid of QuickAccessCard components
 */
export function QuickAccessGrid({ items = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl p-5 h-32"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <QuickAccessCard
          key={index}
          title={item.title}
          subtitle={item.subtitle}
          icon={item.icon}
          path={item.path}
          requiresNetwork={item.requiresNetwork}
        />
      ))}
    </div>
  );
}

export default QuickAccessCard;
