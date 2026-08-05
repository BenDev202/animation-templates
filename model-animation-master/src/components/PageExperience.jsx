import React from "react";
import Model from "./Model";

const PageExperience = () => {
  return (
    <section className="w-full relative bg-neutral-200">


      <div className="fixed inset-0 z-10">
        <Model />
      </div>


      <div className="size-full absolute inset-0 flex justify-evenly pointer-events-none">
        <div className="h-full shrink-0 w-px bg-amber-800/30"></div>
        <div className="h-full shrink-0 w-px bg-amber-800/30"></div>
        <div className="h-full shrink-0 w-px bg-amber-800/30"></div>
        <div className="h-full shrink-0 w-px bg-amber-800/30"></div>
        <div className="h-full shrink-0 w-px bg-amber-800/30"></div>
      </div>

      <div className="h-screen w-full flex items-end p-12">
        <h1 className="text-[12vw] tracking-tight text-amber-900 leading-none uppercase">
          TImeless
        </h1>
      </div>

      <div className=" w-full py-24 space-y-24">
        <div className="flex p-12">
          <div className="max-w-sm">
            <h2 className="text-4xl font-light tracking-tight text-amber-900 mb-4">
              Ancient Artistry
            </h2>
            <p className="text-lg text-amber-800/70">
              Discover the beauty of classical sculptures that have withstood
              the test of time, each piece telling a story of civilizations
              past.
            </p>
          </div>
        </div>

        <div className="flex p-12 justify-end">
          <div className="max-w-sm">
            <h2 className="text-4xl font-light tracking-tight text-amber-900 mb-4">
              Living History
            </h2>
            <p className="text-lg text-amber-800/70">
              Experience the craftsmanship of ancient artisans whose work
              continues to inspire and captivate audiences worldwide.
            </p>
          </div>
        </div>

        <div className="flex p-12">
          <div className="max-w-sm">
            <h2 className="text-4xl font-light tracking-tight text-amber-900 mb-4">
              Eternal Beauty
            </h2>
            <p className="text-lg text-amber-800/70">
              Our collection showcases masterpieces from ancient Greece and
              Rome, preserved through centuries of history.
            </p>
          </div>
        </div>

        <div className="flex p-12 justify-end">
          <div className="max-w-sm">
            <h2 className="text-4xl font-light tracking-tight text-amber-900 mb-4">
              Timeless Elegance
            </h2>
            <p className="text-lg text-amber-800/70">
              Each piece in our collection is a testament to the timeless beauty
              and craftsmanship of ancient civilizations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageExperience;
