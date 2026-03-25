
import { useOutletContext, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Dashboard() {
  const { username } = useOutletContext<{ username: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const syncedPlatforms = localStorage.getItem("syncedPlatforms");
    if (syncedPlatforms) {
      const parsed = JSON.parse(syncedPlatforms);
      const hasSyncedPlatforms = Object.values(parsed).some(value => value === true);
      if (hasSyncedPlatforms) {
        navigate("/dashboardFill");
      }
    }
  }, [navigate]);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-3xl font-bold text-(--text-color)">Welcome, {username}!</h2>
      </div>

      {/* This is the display when there's no connected platforms yet */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 max-w-full mx-auto'>
        <div className="outline-dashed outline-3 outline-[#192B45] rounded-sm h-20"></div>
        <div className="outline-dashed outline-3 outline-[#192B45] rounded-sm h-20"></div>
        <div className="outline-dashed outline-3 outline-[#192B45] rounded-sm h-20"></div>
      </div>

      {/* <div className="mt-5 flex-1 rounded-lg outline-3 outline-dashed outline-(--secondary-text-color)]"></div> */}
        <div className='outline-dashed outline-3 outline-[--secondary-text-color] rounded-sm mt-5 h-130 flex flex-col justify-center items-center text-lg'>
          <p className='text-center text-[--secondary-text-color] mb-2'>You don’t seem to have any connected platform yet.</p>
          <p className='text-center text-[--secondary-text-color]'>Click the button below to start linking your accounts.</p>
          <button 
            className='mt-5 px-5 py-2 rounded-sm bg-(--primary-color) hover:bg-(--hover-primary-color) text-(--background-color)'
            onClick={() => window.location.href = '/settings'}
          >Link your platforms</button>
        </div>
    </div>
  )
}
