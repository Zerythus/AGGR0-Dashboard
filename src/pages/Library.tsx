export default function Dashboard() {

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-3xl font-bold text-(--text-color)">Library</h2>
      </div>
      This page doesn't do anything but display the games. It may even confuse the users that they can click the card and launch the game, when it's not
      Considering to remove this page
      <div className='grid grid-cols-1 md:grid-cols-4 gap-5 mt-10 w-3xl'>
        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>
        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>
        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>
        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>

        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>
        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>
        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>
        <div className="outline-dashed outline-3 outline-(--background-color2) rounded h-70"></div>
        
      </div>
      

    </div>
  )
}
