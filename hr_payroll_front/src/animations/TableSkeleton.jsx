import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <tbody>
      {[...Array(rows)].map((_, i) => (
        <tr key={i}>
          {[...Array(cols)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-shimmer rounded"></div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

/* 
        to  use proffesional table skeleton 

        1.npm install framer-motion
        2.import { motion, AnimationPresence } from 'framer-motion';

        <AnimatePresence mode="wait">
            { loading ? (
                <motion.tbody key='loading' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} >
                    <TableSkeleton rows = {5} cols = (9) />
                </motion.tbody>
            ):(
                <motion.tbody key='data' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} >

                        // display the table with the data you get from the backend in here
            
                </motion.tbody>
            )
        }
        </AnimatePresence>

*/
