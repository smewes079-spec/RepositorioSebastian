import Layout from './Layout.jsx';

export default function ComingSoon({ title, description }) {
  return (
    <Layout title={title}>
      <div className="bg-white rounded-2xl border border-black/5 p-16 flex flex-col items-center text-center">
        <p className="font-serif text-xl text-[#2C2420] mb-2">Próximamente</p>
        <p className="text-sm text-[#2C2420]/60 max-w-md">{description}</p>
      </div>
    </Layout>
  );
}
