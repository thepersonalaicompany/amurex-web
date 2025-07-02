import React from "react";
import { Navbar } from "@amurex/ui/components";
import HomeClient from "@amurex/web/components/Home.client";

const HomePage = (): JSX.Element => {
  return (
    <>
      <Navbar />
      <HomeClient />
    </>
  );
};

export default HomePage;
