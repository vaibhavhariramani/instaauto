import { motion } from 'framer-motion';

export function FullScreenLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <motion.div
        className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      />
    </div>
  );
}
