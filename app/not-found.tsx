import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-6 text-center">
      <h2 className="text-3xl font-black text-slate-800 uppercase mb-2">Página Não Encontrada</h2>
      <p className="text-gray-500 mb-6">Desculpe, a página que você está procurando não existe ou foi movida.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-emerald-600 text-white rounded font-bold uppercase text-xs tracking-wider hover:bg-emerald-700 transition-colors"
      >
        Voltar ao Início
      </Link>
    </div>
  );
}
