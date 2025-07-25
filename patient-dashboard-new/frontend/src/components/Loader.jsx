import { motion } from 'framer-motion';

export default function Loader({ variant = 'route' }) {
  const size = variant === 'splash' ? 'h-40 w-40' : 'h-24 w-24';
  const bg   = variant === 'splash' ? 'bg-gradient-to-r from-primary via-primary2 to-primary' : 'bg-primary';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg/90 z-[2000]">
      <motion.div
        className={`${size} rounded-full ${bg} relative overflow-hidden`}
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
      >
        <motion.div
          className="absolute inset-4 bg-bg rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
}
