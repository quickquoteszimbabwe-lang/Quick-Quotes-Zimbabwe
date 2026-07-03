import { db } from "./index";
import { categoriesTable, subcategoriesTable, servicesTable } from "./schema";

interface ServiceSeed {
  name: string;
  featured?: boolean;
}

interface SubcategorySeed {
  name: string;
  services: (string | ServiceSeed)[];
}

interface CategorySeed {
  name: string;
  icon: string;
  featured?: boolean;
  subcategories?: SubcategorySeed[];
  services?: (string | ServiceSeed)[];
}

const DATA: CategorySeed[] = [
  {
    name: "Construction & Building",
    icon: "HardHat",
    featured: true,
    subcategories: [
      { name: "Building Construction", services: ["New house construction", "Commercial buildings", "House extensions", "Renovations"] },
      { name: "Foundations", services: ["Foundation excavation", "Concrete foundations", "Reinforcement installation"] },
      { name: "Bricklaying & Masonry", services: ["Bricklaying", "Block laying", "Stone masonry", "Plastering"] },
      { name: "Roofing", services: ["Roof installation", "Roof repairs", "Roof replacement", "Roof painting"] },
      { name: "Painting & Finishing", services: ["Interior painting", "Exterior painting", "Waterproofing", "Decorative finishes"] },
      { name: "Flooring", services: ["Tiling", "Laminate flooring", "Vinyl flooring", "Wooden flooring", "Floor polishing"] },
      { name: "Ceilings", services: ["Ceiling installation", "Ceiling repairs", "Suspended ceilings"] },
      { name: "Driveways & Paving", services: ["Driveway paving", "Walkways", "Interlocking bricks"] },
      { name: "Boundary Walls", services: ["Boundary walls", "Retaining walls", "Security walls"] },
      { name: "Swimming Pools", services: ["Pool construction", "Pool repairs"] },
    ],
  },
  {
    name: "Borehole & Water Services",
    icon: "Droplet",
    featured: true,
    services: ["Water survey", "Borehole drilling", "Borehole deepening", "Borehole flushing", "Borehole recasing", "Pump installation", "Pump repairs", "Pump fishing", "Tank installation", "Water filtration", "Solar pumping systems"],
  },
  {
    name: "Plumbing",
    icon: "Wrench",
    featured: true,
    services: ["Plumbing installation", "Pipe repairs", "Leak detection", "Toilet installation", "Bathroom plumbing", "Kitchen plumbing", "Drain unblocking", "Geyser installation", "Geyser repairs", "Septic tank installation", "Septic tank cleaning"],
  },
  {
    name: "Electrical",
    icon: "Zap",
    featured: true,
    services: ["House wiring", "Commercial wiring", "Solar installation", "Solar maintenance", "Generator installation", "Generator servicing", "Lighting installation", "Fault finding", "Electrical inspection"],
  },
  {
    name: "Carpentry & Joinery",
    icon: "Hammer",
    services: ["Kitchen cupboards", "Built-in wardrobes", "Doors", "Windows", "Furniture making", "Office furniture", "Shelving", "Decking"],
  },
  {
    name: "Welding & Steel Fabrication",
    icon: "Flame",
    services: ["Gates", "Burglar bars", "Carports", "Steel structures", "Trailer fabrication", "Welding repairs"],
  },
  {
    name: "Glass & Aluminium",
    icon: "Layers",
    services: ["Aluminium windows", "Aluminium doors", "Shower cubicles", "Mirrors", "Glass replacement", "Shopfronts"],
  },
  {
    name: "Cleaning Services",
    icon: "Sparkles",
    featured: true,
    services: ["House cleaning", "Office cleaning", "Deep cleaning", "Carpet cleaning", "Sofa cleaning", "Mattress cleaning", "Window cleaning", "Post-construction cleaning", "Pest control", "Fumigation"],
  },
  {
    name: "Landscaping & Gardening",
    icon: "Trees",
    services: ["Garden design", "Lawn maintenance", "Tree cutting", "Tree pruning", "Hedge trimming", "Irrigation installation"],
  },
  {
    name: "Agriculture",
    icon: "Wheat",
    services: ["Tractor hire", "Land preparation", "Irrigation installation", "Greenhouse installation", "Farm fencing", "Farm labour", "Livestock services", "Crop spraying"],
  },
  {
    name: "Transport & Logistics",
    icon: "Truck",
    featured: true,
    services: ["Truck hire", "Furniture moving", "Local removals", "Cross-border removals", "Courier services", "Motorcycle delivery", "Construction material delivery", "Heavy equipment transport"],
  },
  {
    name: "Vehicle Services",
    icon: "Car",
    services: ["Vehicle servicing", "Mobile mechanic", "Engine repairs", "Brake repairs", "Suspension repairs", "Auto electrical", "Battery replacement", "Tyre fitting", "Wheel alignment", "Car wash", "Vehicle detailing", "Towing"],
  },
  {
    name: "Car Rentals",
    icon: "CarFront",
    services: ["Economy cars", "Luxury cars", "SUVs", "Double cabs", "Vans", "Wedding vehicles", "Chauffeur services", "Airport transfers"],
  },
  {
    name: "Property & Real Estate",
    icon: "Home",
    featured: true,
    subcategories: [
      { name: "House Rentals", services: ["Houses", "Apartments", "Rooms", "Student accommodation"] },
      { name: "Commercial Property", services: ["Offices", "Shops", "Warehouses"] },
      { name: "Property Services", services: ["Property sales", "Land sales", "Property valuation", "Property inspection", "Property management", "Diaspora property management"] },
    ],
  },
  {
    name: "Security Services",
    icon: "Shield",
    services: ["Security guards", "CCTV installation", "Alarm systems", "Electric fencing", "Access control"],
  },
  {
    name: "Beauty & Personal Care",
    icon: "Scissors",
    featured: true,
    subcategories: [
      { name: "Hair", services: ["Hair braiding", "Hair styling", "Hair colouring", "Hair treatment", "Barber services"] },
      { name: "Beauty", services: ["Makeup", "Nail technicians", "Eyelashes", "Skincare", "Spa", "Massage"] },
    ],
  },
  {
    name: "Fashion & Tailoring",
    icon: "Shirt",
    services: ["Dressmaking", "Suit tailoring", "School uniforms", "Alterations", "Shoe repairs", "Embroidery"],
  },
  {
    name: "Events & Entertainment",
    icon: "PartyPopper",
    featured: true,
    services: ["Wedding planning", "Event planning", "DJs", "MCs", "Live bands", "Photography", "Videography", "Catering", "Tent hire", "Chair hire", "Décor", "Sound systems"],
  },
  {
    name: "Education",
    icon: "GraduationCap",
    services: ["Private tutoring", "Online tutoring", "Exam preparation", "Homework assistance", "Language lessons", "Music lessons", "Computer lessons", "Driving lessons"],
  },
  {
    name: "Health & Wellness",
    icon: "HeartPulse",
    services: ["Home nursing", "Physiotherapy", "Nutrition consulting", "Personal training", "Fitness coaching"],
  },
  {
    name: "Professional Services",
    icon: "Briefcase",
    services: ["Lawyers", "Accountants", "Auditors", "Tax consultants", "Architects", "Engineers", "Quantity surveyors", "Project managers", "Business consultants", "HR consultants"],
  },
  {
    name: "IT & Digital Services",
    icon: "Laptop",
    featured: true,
    services: ["Website development", "Mobile app development", "Graphic design", "Logo design", "Social media management", "Digital marketing", "SEO", "Computer repairs", "Network installation", "CCTV networking"],
  },
  {
    name: "Printing & Branding",
    icon: "Printer",
    services: ["Business cards", "Flyers", "Banners", "Vehicle branding", "T-shirt printing", "Packaging", "Labels", "Promotional materials"],
  },
  {
    name: "Home Services",
    icon: "Cog",
    services: ["Appliance repairs", "TV installation", "Satellite installation", "Air conditioner installation", "Air conditioner servicing", "Fridge repairs", "Washing machine repairs", "Locksmith", "Handyman"],
  },
  {
    name: "Household Help",
    icon: "Users",
    services: ["Housemaids", "Babysitters", "Nannies", "Elderly care", "Caregivers", "Cooks"],
  },
  {
    name: "Pet Services",
    icon: "Dog",
    services: ["Pet grooming", "Dog walking", "Pet sitting", "Veterinary services", "Pet transport"],
  },
  {
    name: "Financial Services",
    icon: "Landmark",
    services: ["Insurance brokers", "Loan consultants", "Investment advisors", "Financial planning", "Bookkeeping"],
  },
  {
    name: "Travel & Tourism",
    icon: "Plane",
    services: ["Holiday planning", "Tour guides", "Hotel bookings", "Airport shuttle", "Visa assistance"],
  },
  {
    name: "Equipment Hire",
    icon: "Boxes",
    services: ["Generators", "Excavators", "TLB hire", "Cranes", "Scaffolding", "Concrete mixers", "Compactors", "Water bowsers"],
  },
  {
    name: "Miscellaneous",
    icon: "Package",
    services: ["Waste collection", "Skip bin hire", "Recycling", "Firewood delivery", "Gas delivery", "Ice delivery", "Courier errands", "Personal assistants"],
  },
];

async function main() {
  const existing = await db.select({ id: categoriesTable.id }).from(categoriesTable);
  if (existing.length > 0) {
    console.log(`Categories already seeded (${existing.length} found). Skipping. Pass --force to re-seed.`);
    if (!process.argv.includes("--force")) {
      process.exit(0);
    }
    console.log("Force flag detected: clearing existing hierarchy tables...");
    await db.delete(servicesTable);
    await db.delete(subcategoriesTable);
    await db.delete(categoriesTable);
  }

  let categoryOrder = 0;
  for (const cat of DATA) {
    categoryOrder += 1;
    const [category] = await db
      .insert(categoriesTable)
      .values({
        name: cat.name,
        icon: cat.icon,
        featured: cat.featured ?? false,
        active: true,
        sortOrder: categoryOrder,
      })
      .returning();

    let serviceOrder = 0;

    if (cat.subcategories) {
      let subOrder = 0;
      for (const sub of cat.subcategories) {
        subOrder += 1;
        const [subcategory] = await db
          .insert(subcategoriesTable)
          .values({
            categoryId: category.id,
            name: sub.name,
            active: true,
            sortOrder: subOrder,
          })
          .returning();

        for (const svc of sub.services) {
          serviceOrder += 1;
          const svcName = typeof svc === "string" ? svc : svc.name;
          const svcFeatured = typeof svc === "string" ? false : (svc.featured ?? false);
          await db.insert(servicesTable).values({
            name: svcName,
            icon: cat.icon,
            categoryId: category.id,
            subcategoryId: subcategory.id,
            active: true,
            featured: svcFeatured,
            sortOrder: serviceOrder,
          });
        }
      }
    }

    if (cat.services) {
      for (const svc of cat.services) {
        serviceOrder += 1;
        const svcName = typeof svc === "string" ? svc : svc.name;
        const svcFeatured = typeof svc === "string" ? false : (svc.featured ?? false);
        await db.insert(servicesTable).values({
          name: svcName,
          icon: cat.icon,
          categoryId: category.id,
          subcategoryId: null,
          active: true,
          featured: svcFeatured,
          sortOrder: serviceOrder,
        });
      }
    }

    console.log(`Seeded category: ${cat.name} (${serviceOrder} services)`);
  }

  console.log("Done seeding categories, subcategories, and services.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
