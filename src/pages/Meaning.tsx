 import React from 'react';
 import { Link } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { ThemeToggle } from '@/components/ikigai';
 import { useState } from 'react';
 
 const Meaning: React.FC = () => {
   const [isDarkMode, setIsDarkMode] = useState(true);
 
   const bgColor = isDarkMode ? 'bg-[#181818]' : 'bg-white';
   const textColor = isDarkMode ? 'text-primary' : 'text-[#181818]';
   const subtextColor = isDarkMode ? 'text-primary/80' : 'text-[#181818]/80';
 
   return (
     <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
       {/* Header */}
       <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
         <div className="flex items-center gap-2">
           <span className="text-primary text-2xl">✦</span>
           <span 
             className={`text-lg uppercase tracking-[0.2em] font-bold ${isDarkMode ? 'text-white' : 'text-[#181818]'}`}
             style={{ fontFamily: 'Consolas, monospace' }}
           >
             IKIGAI
           </span>
         </div>
         <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
       </header>
 
       {/* Main Content */}
       <main className="min-h-screen flex items-center">
         <div className="container mx-auto px-6 lg:px-12">
           <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
             {/* Left Column - Ikigai Diagram SVG */}
             <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
               <svg 
                 viewBox="0 0 400 400" 
                 className="w-full max-w-[400px] h-auto"
               >
                 {/* Outer circles - dotted */}
                 <circle 
                   cx="200" cy="130" r="110" 
                   fill="none" 
                   stroke="#ed565a" 
                   strokeWidth="2" 
                   strokeDasharray="4 4"
                   opacity="0.6"
                 />
                 <circle 
                   cx="270" cy="200" r="110" 
                   fill="none" 
                   stroke="#ed565a" 
                   strokeWidth="2" 
                   strokeDasharray="4 4"
                   opacity="0.6"
                 />
                 <circle 
                   cx="200" cy="270" r="110" 
                   fill="none" 
                   stroke="#ed565a" 
                   strokeWidth="2" 
                   strokeDasharray="4 4"
                   opacity="0.6"
                 />
                 <circle 
                   cx="130" cy="200" r="110" 
                   fill="none" 
                   stroke="#ed565a" 
                   strokeWidth="2" 
                   strokeDasharray="4 4"
                   opacity="0.6"
                 />
 
                 {/* Labels */}
                 <text 
                   x="155" y="105" 
                   fill="#ed565a" 
                   fontSize="12" 
                   fontFamily="Consolas, monospace"
                   textAnchor="middle"
                 >
                   PASSION
                 </text>
                 <text 
                   x="245" y="105" 
                   fill="#ed565a" 
                   fontSize="12" 
                   fontFamily="Consolas, monospace"
                   textAnchor="middle"
                 >
                   MISSION
                 </text>
                 <text 
                   x="145" y="310" 
                   fill="#ed565a" 
                   fontSize="12" 
                   fontFamily="Consolas, monospace"
                   textAnchor="middle"
                 >
                   PROFESSION
                 </text>
                 <text 
                   x="255" y="310" 
                   fill="#ed565a" 
                   fontSize="12" 
                   fontFamily="Consolas, monospace"
                   textAnchor="middle"
                 >
                   VOCATION
                 </text>
 
                 {/* Center star/diamond */}
                 <g transform="translate(200, 200)">
                   <path 
                     d="M0,-25 L5,-5 L25,0 L5,5 L0,25 L-5,5 L-25,0 L-5,-5 Z" 
                     fill="#ed565a"
                   />
                   <text 
                     y="45" 
                     fill="#ed565a" 
                     fontSize="11" 
                     fontFamily="Consolas, monospace"
                     textAnchor="middle"
                   >
                     ikigai
                   </text>
                 </g>
 
                 {/* Connecting lines from star to edges */}
                 <line x1="200" y1="175" x2="200" y2="130" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
                 <line x1="225" y1="200" x2="270" y2="200" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
                 <line x1="200" y1="225" x2="200" y2="270" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
                 <line x1="175" y1="200" x2="130" y2="200" stroke="#ed565a" strokeWidth="1" opacity="0.5"/>
               </svg>
             </div>
 
             {/* Right Column - Content */}
             <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
               <h1 
                 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${textColor} leading-tight mb-6`}
                 style={{ fontFamily: 'Consolas, monospace' }}
               >
                 You're productive,<br />
                 but it feels hollow
               </h1>
               
               <p 
                 className={`text-lg md:text-xl ${subtextColor} mb-8`}
                 style={{ fontFamily: 'Consolas, monospace' }}
               >
                 1. Ikigai clarifies your purpose
               </p>
 
               <Link to="/ikigai">
                 <Button 
                   className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg"
                   style={{ fontFamily: 'Consolas, monospace' }}
                 >
                   Start Ikigai Test
                 </Button>
               </Link>
             </div>
           </div>
         </div>
       </main>
     </div>
   );
 };
 
 export default Meaning;