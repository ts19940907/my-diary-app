export const FullPageSpinner = () => {
  return (
    <div className="z-[9999] fixed inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-50">
      <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
      <p className="text-slate-600 font-medium animate-pulse">読み込み中...</p>
    </div>
  );
};


export default FullPageSpinner;