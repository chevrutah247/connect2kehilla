
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const businesses = [
  // ALARMS & SECURITY
  { name: "Smart Security - Waldman", phone: "917-975-5598", categoryRaw: "Alarms & Security", categories: ["alarms", "security", "cctv", "intercoms"], area: "Brooklyn", state: "NY", description: "Closed Circuit TV, Intercoms, Wireless Hold Up, Medical Alert Device" },

  // ALTERATIONS
  { name: "Seamstress - Rivky Weinberger", phone: "(718) 963-1797", categoryRaw: "Alterations", categories: ["alterations", "seamstress", "tailoring"], area: "Brooklyn", state: "NY", description: "For All Alterations, Professional & Experienced, By Appointments Only" },
  { name: "Shiffy Couture Alterations", phone: "718-852-8200", categoryRaw: "Alterations", categories: ["alterations", "seamstress", "tailoring", "beading"], area: "Brooklyn", state: "NY", address: "71 Lee Ave, Brooklyn, NY", description: "Custom Made Alterations for All Occasions, Hand Beading My Specialty" },

  // APPETIZING
  { name: "Schwartz Appetizing", phone: "718-884-1044", categoryRaw: "Appetizing", categories: ["appetizing", "food", "catering"], area: "Brooklyn", state: "NY", email: "order@schwartzappetizing.com", website: "schwartzappetizing.com", description: "The Famous Schwartz Appetizing" },
  { name: "Weinbergers", phone: "718-387-1835", categoryRaw: "Appetizing", categories: ["appetizing", "food", "herring", "platters"], area: "Williamsburg", state: "NY", address: "345 Willoughby Ave, Brooklyn, NY 11205", description: "Delectables Selection of Herring, Dips, Spreads, Pickles, Olives, Nuts, Chocolates and Platters" },
  { name: "Freund's Kitchen", phone: "718-851-1111", categoryRaw: "Appetizing", categories: ["appetizing", "food", "sushi", "platters"], area: "Brooklyn", state: "NY", address: "5398 18th Ave, Brooklyn, NY", website: "www.FreundsKitchen.com", description: "Dips, Herring, Platters, Sushi" },
  { name: "Golden Appetizing", phone: "", categoryRaw: "Appetizing", categories: ["appetizing", "food", "wholesale"], area: "Spring Valley", state: "NY", address: "114 Kosciuszko Ave, Spring Valley, NY 10977", description: "Salads & Appetizing Products, Serving Groceries, Supermarkets, Caterers & Schools" },

  // APPLIANCES (Sales)
  { name: "Appliance Choice", phone: "718-640-1703", categoryRaw: "Appliances", categories: ["appliances", "kitchen"], area: "Brooklyn", state: "NY", description: "Make A Smart Appliance Choice, Special packages for Kallahs and New constructions" },
  { name: "Hope Appliance", phone: "718-522-1570", categoryRaw: "Appliances", categories: ["appliances", "electronics", "audio"], area: "Williamsburg", state: "NY", address: "156 Hooper Street, Brooklyn, NY", description: "Major, Small Appliances & Audio" },
  { name: "Williamsburg Vacuum & Sewing Machines", phone: "718-384-0851", categoryRaw: "Appliances", categories: ["appliances", "vacuum", "sewing"], area: "Williamsburg", state: "NY", address: "716 Myrtle Ave, Brooklyn, NY", website: "www.mhvacuum.com", description: "Sales, Service, Parts - Miele, Sebo brands. Free Shipping or Delivery" },
  { name: "MS Appliances", phone: "718-963-8600", categoryRaw: "Appliances", categories: ["appliances", "kitchen"], area: "Paterson", state: "NJ", address: "126 3rd Ave, Paterson, NJ 07514", description: "Plan Visualize Realize" },
  { name: "Buy & Save Appliances", phone: "718-355-8100", categoryRaw: "Appliances", categories: ["appliances", "kitchen"], area: "Brooklyn", state: "NY", address: "715 Myrtle Ave, Brooklyn, NY 11206", email: "sales@buyandsaveappliances.com", website: "www.buyandsaveappliances.com", description: "Appliances Shopping Done Right!" },
  { name: "World of Appliances", phone: "718-313-0506", categoryRaw: "Appliances", categories: ["appliances", "kitchen", "showroom"], area: "Mahwah", state: "NJ", address: "2001 MacArthur Blvd, Mahwah, NJ 07430", website: "www.woapliances.com", description: "Top Brand Appliances, Fully stocked showroom. Free Delivery, Financing Available" },
  { name: "S&W Appliances", phone: "718-387-8660", categoryRaw: "Appliances", categories: ["appliances", "kitchen", "showroom"], area: "Williamsburg", state: "NY", address: "163 Wallabout Street, Brooklyn, NY 11206", website: "www.swappliances.com", description: "It's more than the appliances, it's the experience" },
  { name: "S&W Appliances - Monroe", phone: "845-777-8660", categoryRaw: "Appliances", categories: ["appliances", "kitchen", "showroom"], area: "Monroe", state: "NY", address: "101 Campestre Pl, Monroe, NY 10960", website: "www.swappliances.com", description: "It's more than the appliances, it's the experience" },
  { name: "All Home Appliances", phone: "718-237-0990", categoryRaw: "Appliances", categories: ["appliances", "kitchen", "showroom"], area: "Williamsburg", state: "NY", address: "196 Lee Ave, Brooklyn, NY", email: "allhomeappliance@yahoo.com", description: "Major Appliances Showroom. Package deals for Kallahs and new homeowners" },
  { name: "Pluggins", phone: "", categoryRaw: "Appliances", categories: ["appliances", "electronics", "kitchenware"], area: "Brooklyn", state: "NY", description: "Electronics, Appliances, Kitchenware" },
  { name: "Koltech", phone: "718-388-6863", categoryRaw: "Appliances", categories: ["appliances", "electronics"], area: "Brooklyn", state: "NY", address: "4363 13th Ave / 50 Spencer Ave, Brooklyn, NY", description: "Electronics, Appliances" },

  // APPLIANCES REPAIR
  { name: "Superior Appliance Repair", phone: "718-854-1600", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Brooklyn", state: "NY", description: "We Stock All Parts. Appliance problems?" },
  { name: "Microwave Repair", phone: "718-831-7509", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "microwave", "repair"], area: "Brooklyn", state: "NY", description: "The Microwave Expert" },
  { name: "Mr. Fridge", phone: "347-699-4141", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "refrigerator", "oven", "repair"], area: "Brooklyn", state: "NY", email: "mrfridgeservice@gmail.com", description: "Oven Repairs. Repairs on most models of stoves & ovens. Repairs on refrigerators" },
  { name: "Aharon's Appliance Repair", phone: "718-781-3323", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "washer", "dryer", "oven", "repair"], area: "Brooklyn", state: "NY", description: "Front & Top Loading Washers/Dryers, Stoves & Ovens, Cooktops & Ranges. Plus Clogged Dryer Vents" },
  { name: "Reliable Appliance Repair", phone: "718-782-7031", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "washer", "dryer", "refrigerator", "repair"], area: "Brooklyn", state: "NY", description: "All Makes & Models, Same Day Service. Miele Authorized. Authorized for Whirlpool, Maytag" },
  { name: "Bitachon Appliance Repair", phone: "(718) 414-5918", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "washer", "dryer", "oven", "repair"], area: "Boro Park", state: "NY", description: "Washers/Dryers, Dishwashers, Gas Ranges/Ovens, Refrigerators. Prompt, Reliable" },
  { name: "Hershey's Appliance Repair", phone: "718-705-9696", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "washer", "dryer", "repair"], area: "Brooklyn", state: "NY", description: "Washers, Dryers, Refrigerators, Ovens, Dishwashers. We Stock All Parts!" },
  { name: "Front Loader Expert Repair", phone: "718-682-0140", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "washer", "repair"], area: "Brooklyn", state: "NY", description: "All Parts In Stock. Trust Only The Expert" },
  { name: "M.M. Appliance Service", phone: "917-409-8386", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "installation", "repair"], area: "Brooklyn", state: "NY", description: "Repairs, Expert Installation. Mr. Mandel 917-409-8386, Mr. Stark 917-855-8532" },
  { name: "Appliance Maven", phone: "347-620-5897", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "dryer-vent", "repair"], area: "Brooklyn", state: "NY", email: "info@theappliancemaven.com", website: "theappliancemaven.com", description: "Washer, Dryers, Refrigerators, Freezers, Gas Ranges, Ovens, Dishwashers. Also Dryer Vent Cleaning" },
  { name: "Fixi Appliance & Vacuum Repair", phone: "347-709-8643", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "vacuum", "repair"], area: "Brooklyn", state: "NY", description: "Honest, Reliable, Affordable. Washers, Dryers, Gas Ranges, Ovens, Refrigerators, Vacuums" },
  { name: "M. Klinger Appliance Repair", phone: "718-871-7637", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "ac", "repair"], area: "Brooklyn", state: "NY", email: "servicecalls@mkappliancesvc.com", website: "www.mkappliancesvc.com", description: "Servicing all major appliances. A/C cleaning. Landlord Accounts Welcome. EPA Certified" },
  { name: "Bingo Appliance Repair", phone: "347-451-9320", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Brooklyn", state: "NY", description: "Leiby Braun. Washer, Dryer, Stove, Refrigerator, Dishwasher. Service & Repairs" },
  { name: "Ready Appliance Repair", phone: "718-694-0900", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Boro Park", state: "NY", description: "Servicing most makes and models. No Service Charge With Repair. Parts Hotline 800-360-0522" },
  { name: "Tony's Any Time Appliance Repair", phone: "917-939-3761", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "refrigerator", "oven", "repair"], area: "Brooklyn", state: "NY", description: "Expert Repair on Major Appliances: Refrigerators, Freezers, Ovens, Cook Tops, Dryers, Sub-Zeros" },
  { name: "Shlomy's Appliance Repair", phone: "347-423-0204", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Brooklyn", state: "NY", description: "Formerly Buddy's. Washer, Dryer, Refrigerator, Oven, Dishwasher, Microwave. Reasonable Prices" },
  { name: "M&H Appliance Repair & Installation", phone: "347-930-8021", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "installation", "repair"], area: "Brooklyn", state: "NY", description: "Ovens, Stove, Refrigerator, Air Conditioner, Microwave, Washer, Dryer, Dishwasher" },
  { name: "Master Appliance Repair", phone: "917-754-0868", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Brooklyn", state: "NY", description: "Done Right. Refrigerators, Freezers, Cooking, Ovens, Dishwashers" },
  { name: "A&B Appliance Repair", phone: "718-854-5721", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Williamsburg", state: "NY", description: "David Greenfeld. Same Day Repairs! We Stock All Parts! We serve Williamsburg & Boro Park daily" },
  { name: "Y&S Appliance Repair", phone: "845-659-8113", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Upstate", state: "NY", description: "Yoel Schwartz. Repair & Installation on Most Model Appliances. Quick Service & Reasonable Prices" },
  { name: "Bosch Mixer Expert Repair", phone: "", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "mixer", "repair"], area: "Brooklyn", state: "NY", description: "Mixer Service Center. 30 Years of Experience. Same Day Service Available" },
  { name: "Kalmy's Appliance Repair", phone: "718-687-8333", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Brooklyn", state: "NY", description: "Kalman Katz. Expert Repairs and Installations. EPA certified" },
  { name: "No Duct Tape - Domestic Appliance Repair", phone: "718-314-9299", categoryRaw: "Appliances Repair", categories: ["appliance-repair", "repair"], area: "Brooklyn", state: "NY", description: "Ask for David" },

  // APPLIANCES INSTALLATION
  { name: "Professional Appliance Installation", phone: "718-951-0090", categoryRaw: "Appliances Installation", categories: ["appliance-installation", "installation"], area: "Brooklyn", state: "NY", description: "25 Years Experience. Microwaves, Convection Ovens, Washers & Dryers, Gas Ranges. Residential, Commercial, Industrial" },

  // DRYER VENT CLEANING
  { name: "DVC Experts", phone: "718-305-7888", categoryRaw: "Dryer Vent Cleaning", categories: ["dryer-vent", "cleaning", "fire-prevention"], area: "Brooklyn", state: "NY", website: "dvcexpert.com", description: "#1 Cause of Home Fires. Saves Energy & Dryer Life" },
  { name: "Machum Dryer Vent Cleaning & Air Duct", phone: "917-586-0553", categoryRaw: "Dryer Vent Cleaning", categories: ["dryer-vent", "air-duct", "cleaning"], area: "Brooklyn", state: "NY", description: "Duct Cleaning Specialists. Emergency Same Day Service. Free Estimate" },

  // APPRAISERS
  { name: "BZH Appraisals & Associates", phone: "347-236-4914", categoryRaw: "Appraisers", categories: ["appraiser", "jewelry", "insurance"], area: "Brooklyn", state: "NY", website: "www.bzh.us", description: "Yossi Horowitz. Insurance Appraisals, Certified Gemologist. Antiques, Fine art, Silver, Judaica" },
  { name: "Premier Appraisal Services", phone: "347-699-6186", categoryRaw: "Appraisers", categories: ["appraiser", "jewelry", "insurance"], area: "Brooklyn", state: "NY", email: "info@premierjewelryappraisal.com", description: "Sara Blumenfeld. Professional Jewelry, Silver, Insurance Appraisals. We come to you!" },
  { name: "Reliable Appraisers", phone: "917-709-9560", categoryRaw: "Appraisers", categories: ["appraiser", "real-estate"], area: "NYC", state: "NY", description: "Serving all Five Boroughs. Individual, Condos, Mixed-use, Construction, Damages, Court" },
  { name: "Interstate Appraisal Inc.", phone: "718-599-2077", categoryRaw: "Appraisers", categories: ["appraiser", "real-estate"], area: "Brooklyn", state: "NY", email: "appraisalservice@yahoo.com", fax: "718-599-2389", description: "Moshe Goldberger. Real Estate Appraisals. Fast, Professional & Reliable" },
  { name: "Victor Schlesinger", phone: "718-625-6707", categoryRaw: "Appraisers", categories: ["appraiser", "real-estate", "commercial"], area: "Brooklyn", state: "NY", address: "184 Park Ave, Brooklyn, NY 11206", fax: "718-625-6898", description: "Certified General Real Estate Appraiser & Consultant. NY & NJ. Estate, Litigation, Arbitration" },
  { name: "Aaron Feldman, MAI", phone: "718-422-9956", categoryRaw: "Appraisers", categories: ["appraiser", "real-estate", "commercial"], area: "Brooklyn", state: "NY", email: "aaron@qualityappraisalinc.com", fax: "718-422-9967", description: "Residential and Commercial Real Estate Appraisal Services" },

  // ARCHITECTS
  { name: "M. Gluck Designs", phone: "718-408-8700", categoryRaw: "Architects", categories: ["architect", "design"], area: "Brooklyn", state: "NY", email: "mgluck@mgluckdesigns.com", website: "mgluckdesigns.com", description: "Moshe Gluck. Creating Your Space to Span Your Style" },
  { name: "Plan IT - Architectural Layout & Design", phone: "718-484-4538", categoryRaw: "Architects", categories: ["architect", "design", "drafting"], area: "Brooklyn", state: "NY", email: "joel@planydesign.com", website: "www.planydesign.com", description: "Joel Lowy. New Plans, Creative Layouts, Interior Design, As Built Plans, Paper To Cad" },
  { name: "Friedman, P.E.", phone: "718-338-7003", categoryRaw: "Architects", categories: ["architect", "engineer", "zoning", "permits"], area: "Brooklyn", state: "NY", email: "office@friedmanpe.com", description: "Moshe M. Friedman. Architectural Engineering, Zoning & Code Consulting. DOB, BSA Variances" },
  { name: "Itamar Design", phone: "646-772-2908", categoryRaw: "Architects", categories: ["architect", "design", "zoning", "permits"], area: "Brooklyn", state: "NY", description: "Zoning Analysis, Permits, Designing, C of O, Consulting" },
  { name: "All Home Layouts", phone: "347-921-4663", categoryRaw: "Architects", categories: ["architect", "design", "drafting"], area: "Brooklyn", state: "NY", email: "ALLHome.A1.Out@gmail.com", description: "Creative Ideas When Every Inch Counts. Residential & Commercial Plans, As Built Plans" },
  { name: "Maviz Architectural Services", phone: "718-305-5990", categoryRaw: "Architects", categories: ["architect"], area: "Brooklyn", state: "NY", website: "www.maviz.com", description: "Architectural Services" },
  { name: "Complete Condo Services", phone: "718-875-9100", categoryRaw: "Architects", categories: ["architect", "condo", "consulting"], area: "Brooklyn", state: "NY", email: "completecondo@gmail.com", description: "Simon Naustein. Consulting on Condominium offering plan projects. Architectural drawings to legal filing" },
  { name: "Yakov D. Kastin", phone: "718-501-2068", categoryRaw: "Architects", categories: ["architect", "design", "3d-rendering"], area: "Brooklyn", state: "NY", description: "Renovating? We can design your home and take you on a full-color 3D tour before work begins" },
  { name: "Blueprint Center", phone: "", categoryRaw: "Architects", categories: ["printing", "copying", "architect"], area: "Brooklyn", state: "NY", description: "Copies, Printing, Scanning, Lamination, Binding, DOB Construction Signs" },

  // PRINTING
  { name: "Print Local", phone: "718-460-2020", categoryRaw: "Printing", categories: ["printing", "copying", "scanning"], area: "Brooklyn", state: "NY", address: "83 Bedford Ave, Brooklyn / 12 Route 59", email: "bkp@printoutlocal.com", website: "www.printoutlocal.com", description: "Copies, Printing, Scanning" },

  // INTERIOR DESIGN
  { name: "Exceed Interiors", phone: "347-444-0346", categoryRaw: "Interior Design", categories: ["interior-design", "design", "space-planning"], area: "Brooklyn", state: "NY", description: "Frigy Garciga. Expert Space Planning + Interior Design. Custom Closet Sketches, Paint Colors" },

  // EXPEDITING
  { name: "Expediting Service - Building & Fire Dept", phone: "718-797-2710", categoryRaw: "Expediting", categories: ["expediting", "permits", "violations"], area: "Brooklyn", state: "NY", description: "Reuven Kalisch. Filings, Plans, Approval, Permits, Violations, C. of O.'s" },

  // ASBESTOS REMOVAL
  { name: "Hi-Rise Environmental", phone: "718-781-7727", categoryRaw: "Asbestos Removal", categories: ["asbestos", "environmental", "removal"], area: "Brooklyn", state: "NY", address: "91 Franklin Ave OFC 1-F, Brooklyn, NY 11205", email: "info@hiriseenvi.com", description: "Asbestos Inspection & Removal, NYS & NYC Certified, ACP5, ACP7 forms, Air Monitoring" },
  { name: "BNH Asbestos", phone: "718-807-1365", categoryRaw: "Asbestos Removal", categories: ["asbestos", "environmental", "removal"], area: "Brooklyn", state: "NY", description: "Asbestos Inspection & Removal. Sampling, Investigations, Air Monitoring, Assessments" },
  { name: "Active Environmental Corp", phone: "718-854-1111", categoryRaw: "Asbestos Removal", categories: ["asbestos", "environmental", "removal"], area: "Brooklyn", state: "NY", email: "info@activegrouplny.com", description: "Tilly Burger. Asbestos Reports, Phase I/II Environmental Audits, Soil Remediation. EPA Certified" },

  // AUTO COLLISION
  { name: "Certified Auto Collision", phone: "718-820-1850", categoryRaw: "Auto Collision", categories: ["auto-body", "collision", "towing"], area: "Brooklyn", state: "NY", address: "621 63rd Street, Brooklyn, NY", description: "Spray Booth, 24hr Towing, Aluminum Repair. Trusted by all major insurance companies" },
  { name: "Citi Collision", phone: "718-568-5566", categoryRaw: "Auto Collision", categories: ["auto-body", "collision", "towing"], area: "Brooklyn", state: "NY", address: "1332 39th Street, Brooklyn, NY 11218", website: "www.citicollision.com", description: "24-hour towing throughout Tristate area, Instant rental delivery. Serving Tri-State Area" },
  { name: "Wiz Collision", phone: "718-925-2949", categoryRaw: "Auto Collision", categories: ["auto-body", "collision", "towing"], area: "Brooklyn", state: "NY", address: "703 Chester Street, Brooklyn, NY 11236", email: "wizcollision@gmail.com", fax: "718-925-2948", description: "Spray Booth, 24 Hour Towing, Rental Replacement, Expert Claim Service" },
  { name: "Grand Collision", phone: "718-852-3530", categoryRaw: "Auto Collision", categories: ["auto-body", "collision"], area: "Brooklyn", state: "NY", address: "33 Grand Ave, Brooklyn, NY", description: "Unibody Straightening, Specialized in Minivans, Expert Color Matching, Insurance Claims" },
  { name: "Kings County Auto Body", phone: "718-399-9500", categoryRaw: "Auto Collision", categories: ["auto-body", "collision", "towing"], area: "Brooklyn", state: "NY", address: "168 Walworth Street, Brooklyn, NY 11205", description: "24 Hour emergency service, Free estimates" },

  // AUTO DEALERS
  { name: "Carmart Inc.", phone: "718-387-5000", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", email: "kingsbeau@gmail.com", description: "Trade-ins for New & Pre-owned Cars. Sale, Lease, Buy, Financing" },
  { name: "Swift Autos", phone: "855-793-2888", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", email: "sales@swiftautos.net", description: "All automotive needs. Hard-to-find vehicles, best deals on leases" },
  { name: "Stereo Leasing Inc.", phone: "(718) 435-0474", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", address: "1734 55th Street, Brooklyn, NY 11204", email: "sales@stereoleasing.com", description: "All Makes & Models at the lowest prices" },
  { name: "Signature Leasing", phone: "718-344-2070", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", description: "Service That Rocks" },
  { name: "Silver Wheels Auto Leasing", phone: "718-360-9420", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", address: "6312 6th Ave, 2nd Fl, Brooklyn, NY 11204", email: "sales@silverwheelsleasing.com", description: "High-End Wheels, High-End Service" },
  { name: "Advance Auto Leasing", phone: "718-363-8686", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", description: "Yerky Weiser / Yoely Goldstein. Brooklyn: 718-363-8686, Upstate: 845-363-8686" },
  { name: "Auto Center", phone: "718-437-9453", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "car"], area: "Brooklyn", state: "NY", address: "Silviane Ave, Brooklyn, NY 11204", description: "Deals on Wheels" },
  { name: "Quality Leasing", phone: "718-435-6695", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", website: "www.qualityleasing.net", description: "All Makes & Models, Cars, Minivans & Trucks. Lowest Prices Guaranteed, Full Warranty" },
  { name: "Cash For Junk Cars", phone: "848-245-5077", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "junk-car", "towing"], area: "Brooklyn", state: "NY", description: "We Pay Top $$$ For All Your Junk Cars. Any Year, Any Model. Free Towing" },
  { name: "Cartwheel Auto Leasing", phone: "718-682-3230", categoryRaw: "Auto Dealers", categories: ["auto-dealer", "lease", "car"], area: "Brooklyn", state: "NY", description: "Avromy Moisgele. Call Cartwheel Today, Drive Your New Car Tomorrow" },

  // AUTO INSURANCE
  { name: "A-Z DMV & Insurance Services", phone: "718-486-1405", categoryRaw: "Auto Insurance", categories: ["insurance", "auto-insurance", "dmv"], area: "Williamsburg", state: "NY", address: "310 Roebling St, Brooklyn, NY 11211", website: "www.azm-car-service.com", fax: "718-636-1406", description: "Lowest Insurance Rates! Home, Auto, Business. Rates as low as $649" },
  { name: "F&W Professional Insurance Brokerage", phone: "718-522-1200", categoryRaw: "Auto Insurance", categories: ["insurance", "auto-insurance", "dmv"], area: "Brooklyn", state: "NY", address: "543 Bedford Ave, Brooklyn, NY 11211", email: "rvinsurance@mail.com", website: "www.nyAutoInsurance.com", fax: "718-388-1638", description: "Lowest Rates in Town! Defensive Driving Class. DMV services. We Fight Moving Violations" },

  // AWNINGS
  { name: "Deluxe Awning", phone: "718-234-6434", categoryRaw: "Awnings", categories: ["awnings", "sukkah", "home-improvement"], area: "Brooklyn", state: "NY", description: "Aluminum & Lexan Awnings, Custom Sukkah Awnings, Roll Up Awnings. Established Since 1928" },
  { name: "Globe Awning Co.", phone: "718-843-5157", categoryRaw: "Awnings", categories: ["awnings", "sukkah", "canopy"], area: "Brooklyn", state: "NY", description: "Moshe Schwartz. Awnings & Canopies. Sukkah Awnings, Canvas, Lexan, Aluminum. Est 1900" },
  { name: "Tri State Awnings", phone: "", categoryRaw: "Awnings", categories: ["awnings", "sukkah"], area: "Brooklyn", state: "NY", address: "50 Bar Myrtle Rd", email: "sales@tristateawnings.com", website: "www.thetristateawnings.com", description: "Practical, Stylish, Durable. Residential, Sukkah" },
  { name: "Sukkah Awnings by Dean the Pioneer", phone: "845-425-1193", categoryRaw: "Awnings", categories: ["awnings", "sukkah"], area: "Upstate", state: "NY", website: "sukkahawningsbydean.com", description: "Sukkah Awnings" },

  // BABY
  { name: "Esti's Boutique", phone: "347-267-8047", categoryRaw: "Baby Clothes & Gifts", categories: ["baby", "clothing", "gifts"], area: "Brooklyn", state: "NY", address: "5309 12 Ave, Brooklyn, NY", description: "Full Array of Baby Layette, Baby Gifts, Baby Essentials, Accessories" },
  { name: "Goodnight Moon", phone: "732-691-0072", categoryRaw: "Baby Nurses", categories: ["baby", "nurse", "newborn"], area: "Brooklyn", state: "NY", description: "24 hour & Nightly Nurses" },
  { name: "Oh Baby", phone: "", categoryRaw: "Baby Furniture", categories: ["baby", "furniture", "strollers"], area: "Brooklyn", state: "NY", address: "1991 Coney Island Ave, Brooklyn, NY 11230", description: "Strollers, Car Seats, Furniture. Large Selection of Layette, Clothes & Bedding" },

  // BAKERIES
  { name: "Gross Bakery", phone: "(718) 851-0182", categoryRaw: "Bakeries", categories: ["bakery", "challah", "cakes"], area: "Boro Park", state: "NY", address: "5406-5412 16th Ave, Brooklyn, NY 11204", description: "The best in Challahs, Cakes and Cookies. Hours daily: 6:00 am-9 p.m." },
  { name: "Williamsburg Bagel & Bakery", phone: "718-222-2944", categoryRaw: "Bakeries", categories: ["bakery", "bagel"], area: "Williamsburg", state: "NY", address: "701 Bedford Ave, Brooklyn, NY", website: "www.willibagel.com", description: "A combination of perfection" },
  { name: "Steinberg's Bakery", phone: "718-486-9100", categoryRaw: "Bakeries", categories: ["bakery"], area: "Williamsburg", state: "NY", address: "153 Clymer St, Brooklyn, NY", description: "" },
  { name: "Sander's Bakery", phone: "718-387-7410", categoryRaw: "Bakeries", categories: ["bakery", "challah", "spelt"], area: "Williamsburg", state: "NY", address: "159 Lee Avenue, Brooklyn, NY", description: "Spelt Products, Cakes, Cookies & Challahs. Sugar Free, Spelt. We Service Caterers & Halls" },
  { name: "Green & Ackerman Bakery, Inc.", phone: "718-625-0289", categoryRaw: "Bakeries", categories: ["bakery", "rugelach", "challah"], area: "Brooklyn", state: "NY", address: "65 Franklin Ave, Brooklyn, NY 11205", fax: "718-625-3231", description: "Home Made Baked Goods: Babka, Rugelach, Danish, Cookies, Challahs" },
  { name: "Gourmet's Delight", phone: "718-576-3190", categoryRaw: "Bakeries", categories: ["bakery", "catering"], area: "Williamsburg", state: "NY", address: "164 Wallabout St, Brooklyn, NY 11206", website: "gsharvk.com", description: "Deliciousness in Every Bite. Full Catering & Corporate Accounts" },
  { name: "Taam Eden Bakery", phone: "(845) 354-8083", categoryRaw: "Bakeries", categories: ["bakery", "cakes", "platters"], area: "Monsey", state: "NY", description: "World famous Delectable Wafer Cake and Simcha Cake Platters" },
  { name: "Korns Bakery", phone: "718-388-8748", categoryRaw: "Bakeries", categories: ["bakery"], area: "Williamsburg", state: "NY", address: "454 Bedford Ave, Brooklyn, NY 11249", description: "" },
  { name: "Black & White Bakery", phone: "718-552-2220", categoryRaw: "Bakeries", categories: ["bakery"], area: "Bronx", state: "NY", address: "520 Park Avenue, Bronx, NY", description: "" },
  { name: "Oneg Bakery", phone: "718-797-0971", categoryRaw: "Bakeries", categories: ["bakery", "challah", "pastries"], area: "Williamsburg", state: "NY", address: "188 Lee Avenue, Brooklyn, NY", description: "Best Challahs, Kipelach, Kokosh Cake and Pastries" },

  // BALLOONS
  { name: "Balloon World", phone: "718-312-9851", categoryRaw: "Balloons", categories: ["balloons", "party", "events"], area: "Brooklyn", state: "NY", description: "Custom Prints, Engagements, Anniversary, Graduation, Bar/Bat Mitzvah, Wedding Shtick" },
  { name: "Helium Balloons", phone: "845-354-5454", categoryRaw: "Balloons", categories: ["balloons", "party"], area: "Monsey", state: "NY", address: "4 Middleton St, Monsey, NY", description: "We Got An Inflation For Your Celebration" },

  // BEAUTY
  { name: "Echama's All Beauty Services", phone: "718-854-8410", categoryRaw: "Beauty Salon", categories: ["beauty", "laser", "facial", "salon"], area: "Boro Park", state: "NY", address: "1302 50th St, Brooklyn, NY", description: "All Laser Treatments, Facial Treatments, Microneedling, Electrolysis, Makeup. 30 Years" },

  // BARGAIN STORES
  { name: "Amazing Savings of Williamsburg", phone: "718-388-2929", categoryRaw: "Bargain Stores", categories: ["bargain", "store", "closeouts"], area: "Williamsburg", state: "NY", address: "331 Rutledge Street, Brooklyn, NY", description: "Brand Name Quality Closeouts at Amazing Prices!" },

  // BATH
  { name: "Green's Bath & Accessories", phone: "718-435-7840", categoryRaw: "Bath & Accessories", categories: ["bath", "accessories", "home"], area: "Brooklyn", state: "NY", address: "4627 13th Ave, Brooklyn, NY", description: "Bath & Accessories" },
  { name: "A1 Tub Refinishing Inc.", phone: "718-258-0988", categoryRaw: "Bath Tubs", categories: ["bath", "tub", "refinishing"], area: "Brooklyn", state: "NY", email: "a1bath18@yahoo.com", fax: "718-879-6483", description: "Bathtub refinishing/reglazing. Since 1998" },

  // BOILER REPAIRS
  { name: "SBS Boilers", phone: "718-727-1010", categoryRaw: "Boiler Repairs & Cleaning", categories: ["boiler", "heating", "repair"], area: "Brooklyn", state: "NY", description: "Complete Gas & Oil Burner Service. Boiler shut down, Violation removal, Chimney cleaning" },
  { name: "Paragon Heating Co.", phone: "718-252-9000", categoryRaw: "Boiler Repairs & Cleaning", categories: ["boiler", "heating", "repair"], area: "Brooklyn", state: "NY", description: "Residential, Commercial, Industrial. Boiler Repair, Violation Removal, Hot Water Heaters" },
  { name: "Boiler Repair - Experienced & Reliable", phone: "917-613-0915", categoryRaw: "Boiler Repairs & Cleaning", categories: ["boiler", "heating", "repair", "emergency"], area: "Brooklyn", state: "NY", description: "24 HR Emergency Service. Commercial & Residential & Industrial" },

  // BOOKBINDING
  { name: "Katz Bookbindery", phone: "(718) 387-7765", categoryRaw: "Bookbinding", categories: ["bookbinding", "printing"], area: "Williamsburg", state: "NY", address: "208 Broadway, Brooklyn, NY 11211", description: "Newspapers, Journals, Antique Leather Binding, Gold Stamping" },

  // BOOKKEEPING
  { name: "Pro Accounting - Samuel Fish", phone: "718-805-3888", categoryRaw: "Bookkeeping", categories: ["bookkeeping", "accounting"], area: "Brooklyn", state: "NY", address: "183 Broadway, Brooklyn, NY 11211", email: "S.fish@ProAccountInc.com", fax: "347-676-0455", description: "Bookkeeping" },
  { name: "VOM - Virtual Office Management", phone: "845-425-4555", categoryRaw: "Bookkeeping", categories: ["bookkeeping", "accounting", "payroll"], area: "Brooklyn", state: "NY", email: "info@vomonline.com", website: "www.vomonline.com", description: "Full-service bookkeeping. QuickBooks setup, Receivables, Payroll and Taxes" },

  // BOOKS / JUDAICA
  { name: "Judaica Software - David Rabbinowitz", phone: "646-760-3154", categoryRaw: "Books & Judaica", categories: ["books", "judaica", "software"], area: "Williamsburg", state: "NY", address: "45 Lee Ave, Brooklyn, NY", description: "Book Binding, Judaica Software" },
  { name: "Torah Software", phone: "", categoryRaw: "Books & Judaica", categories: ["books", "software", "typesetting"], area: "Brooklyn", state: "NY", description: "DBS. Typesetting & fonts. Special Nikud Fonts for Word" },
  { name: "Judaica Center", phone: "718-852-1111", categoryRaw: "Books & Judaica", categories: ["books", "judaica"], area: "Williamsburg", state: "NY", address: "654 Myrtle Ave, Brooklyn, NY", description: "Free Delivery" },
  { name: "Lee Avenue Sforim Center", phone: "(718) 782-2712", categoryRaw: "Books & Judaica", categories: ["books", "judaica", "seforim"], area: "Williamsburg", state: "NY", address: "114 Lee Avenue, Brooklyn, NY 11211", description: "Special Attention for Chosson Package" },
  { name: "Nachlas Books, Gifts & Religious Articles", phone: "(718) 387-9971", categoryRaw: "Books & Judaica", categories: ["books", "judaica", "gifts"], area: "Williamsburg", state: "NY", address: "171 Division Ave, Brooklyn, NY", email: "nachlasjudaica@gmail.com", fax: "(718) 666-4064", description: "Books, Gifts and Religious Articles. Authorized MusicScape Vendor" },
  { name: "Meoros", phone: "718-797-3311", categoryRaw: "Books & Judaica", categories: ["books", "judaica", "games", "children"], area: "Williamsburg", state: "NY", address: "218 Wallabout St, Brooklyn, NY", description: "Judaica, Children's Books, Games. Chosson Package" },
  { name: "Talpios Gifts & Judaica", phone: "718-797-5002", categoryRaw: "Books & Judaica", categories: ["books", "judaica", "gifts"], area: "Williamsburg", state: "NY", address: "684 Bedford Ave, Brooklyn, NY 11249", email: "talpiosbooks@gmail.com", fax: "718-797-4112", description: "English Judaica, Religious Articles, Toys. Gold Stamping, Custom Benchers" },
  { name: "Oytzer Judaica", phone: "718-218-7100", categoryRaw: "Books & Judaica", categories: ["books", "judaica", "gifts"], area: "Williamsburg", state: "NY", address: "191 Lee Avenue, Brooklyn, NY 11211", fax: "718-218-6830", description: "Religious Articles, Books, Games, Gifts. Same day gold stamping. We Ship Worldwide" },
  { name: "Gifts & Judaica (Nichnas)", phone: "718-437-4753", categoryRaw: "Books & Judaica", categories: ["books", "judaica", "gifts", "stamps"], area: "Brooklyn", state: "NY", address: "1802 50th Street, Brooklyn, NY 11204", email: "nichnasil@gmail.com", description: "Same Day Gold Stamping. Custom Benchers, Photo Albums, Rubber Stamps" },
  { name: "Exquisite Creations", phone: "917-971-0698", categoryRaw: "Books & Judaica", categories: ["books", "yearbooks", "photo-albums"], area: "Brooklyn", state: "NY", description: "Yearbooks, Photo Albums, Hardcover Productions" },
];

async function main() {
  console.log(`Starting import of ${businesses.length} businesses...`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const biz of businesses) {
    try {
      // Check for duplicates by name + phone
      const existing = await prisma.business.findFirst({
        where: {
          name: biz.name,
          ...(biz.phone ? { phone: biz.phone } : {}),
        },
      });

      if (existing) {
        console.log(`  SKIP (duplicate): ${biz.name}`);
        skipped++;
        continue;
      }

      await prisma.business.create({
        data: {
          name: biz.name,
          phone: biz.phone || "",
          categoryRaw: biz.categoryRaw,
          categories: biz.categories,
          area: biz.area,
          state: biz.state,
          address: biz.address || null,
          email: biz.email || null,
          website: biz.website || null,
          fax: biz.fax || null,
          description: biz.description || null,
        },
      });
      created++;
      console.log(`  ✓ ${biz.name}`);
    } catch (err: any) {
      console.error(`  ✗ ERROR ${biz.name}: ${err.message}`);
      errors++;
    }
  }

  const total = await prisma.business.count();
  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total in DB: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

