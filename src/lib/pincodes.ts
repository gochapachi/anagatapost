import { PincodeInfo } from "./types";

// In-built high-speed directory for common Indian PIN codes
const PINCODE_DATABASE: Record<string, PincodeInfo> = {
  // Delhi
  "110001": { pincode: "110001", postOffice: "Connaught Place H.O", district: "Central Delhi", state: "Delhi", circle: "Delhi" },
  "110003": { pincode: "110003", postOffice: "Aliganj S.O", district: "Central Delhi", state: "Delhi", circle: "Delhi" },
  "110016": { pincode: "110016", postOffice: "Hauz Khas S.O", district: "South Delhi", state: "Delhi", circle: "Delhi" },
  "110019": { pincode: "110019", postOffice: "Kalkaji S.O", district: "South Delhi", state: "Delhi", circle: "Delhi" },
  "110020": { pincode: "110020", postOffice: "Okhla S.O", district: "South Delhi", state: "Delhi", circle: "Delhi" },
  "110029": { pincode: "110029", postOffice: "Safdarjung Enclave", district: "South Delhi", state: "Delhi", circle: "Delhi" },
  "110092": { pincode: "110092", postOffice: "Anand Vihar S.O", district: "East Delhi", state: "Delhi", circle: "Delhi" },

  // NCR (Noida, Gurugram, Ghaziabad, Faridabad)
  "201301": { pincode: "201301", postOffice: "Noida Sector 1", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", circle: "Uttar Pradesh" },
  "201304": { pincode: "201304", postOffice: "Noida Sector 37", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", circle: "Uttar Pradesh" },
  "122001": { pincode: "122001", postOffice: "Gurgaon H.O", district: "Gurugram", state: "Haryana", circle: "Haryana" },
  "122002": { pincode: "122002", postOffice: "DLF Cyber City S.O", district: "Gurugram", state: "Haryana", circle: "Haryana" },
  "201001": { pincode: "201001", postOffice: "Ghaziabad H.O", district: "Ghaziabad", state: "Uttar Pradesh", circle: "Uttar Pradesh" },
  "121001": { pincode: "121001", postOffice: "Faridabad H.O", district: "Faridabad", state: "Haryana", circle: "Haryana" },

  // Mumbai & Maharashtra
  "400001": { pincode: "400001", postOffice: "Mumbai G.P.O.", district: "Mumbai", state: "Maharashtra", circle: "Maharashtra" },
  "400020": { pincode: "400020", postOffice: "Churchgate S.O", district: "Mumbai", state: "Maharashtra", circle: "Maharashtra" },
  "400050": { pincode: "400050", postOffice: "Bandra West S.O", district: "Mumbai Suburban", state: "Maharashtra", circle: "Maharashtra" },
  "400051": { pincode: "400051", postOffice: "Bandra Kurla Complex", district: "Mumbai Suburban", state: "Maharashtra", circle: "Maharashtra" },
  "400076": { pincode: "400076", postOffice: "Powai IIT S.O", district: "Mumbai Suburban", state: "Maharashtra", circle: "Maharashtra" },
  "411001": { pincode: "411001", postOffice: "Pune G.P.O.", district: "Pune", state: "Maharashtra", circle: "Maharashtra" },
  "411057": { pincode: "411057", postOffice: "Hinjawadi Infotech Park", district: "Pune", state: "Maharashtra", circle: "Maharashtra" },
  "440001": { pincode: "440001", postOffice: "Nagpur G.P.O.", district: "Nagpur", state: "Maharashtra", circle: "Maharashtra" },

  // Bengaluru & Karnataka
  "560001": { pincode: "560001", postOffice: "Bengaluru G.P.O.", district: "Bengaluru Urban", state: "Karnataka", circle: "Karnataka" },
  "560034": { pincode: "560034", postOffice: "Koramangala S.O", district: "Bengaluru Urban", state: "Karnataka", circle: "Karnataka" },
  "560038": { pincode: "560038", postOffice: "Indiranagar S.O", district: "Bengaluru Urban", state: "Karnataka", circle: "Karnataka" },
  "560066": { pincode: "560066", postOffice: "Whitefield S.O", district: "Bengaluru Urban", state: "Karnataka", circle: "Karnataka" },
  "560100": { pincode: "560100", postOffice: "Electronic City S.O", district: "Bengaluru Urban", state: "Karnataka", circle: "Karnataka" },
  "570001": { pincode: "570001", postOffice: "Mysuru H.O", district: "Mysuru", state: "Karnataka", circle: "Karnataka" },

  // Hyderabad & Telangana
  "500001": { pincode: "500001", postOffice: "Hyderabad G.P.O.", district: "Hyderabad", state: "Telangana", circle: "Telangana" },
  "500034": { pincode: "500034", postOffice: "Banjara Hills S.O", district: "Hyderabad", state: "Telangana", circle: "Telangana" },
  "500081": { pincode: "500081", postOffice: "HITEC City / Madhapur", district: "K.V.Rangareddy", state: "Telangana", circle: "Telangana" },

  // Chennai & Tamil Nadu
  "600001": { pincode: "600001", postOffice: "Chennai G.P.O.", district: "Chennai", state: "Tamil Nadu", circle: "Tamil Nadu" },
  "600028": { pincode: "600028", postOffice: "R.A.Puram S.O", district: "Chennai", state: "Tamil Nadu", circle: "Tamil Nadu" },
  "600096": { pincode: "600096", postOffice: "Perungudi OMR S.O", district: "Kanchipuram", state: "Tamil Nadu", circle: "Tamil Nadu" },
  "641001": { pincode: "641001", postOffice: "Coimbatore H.O", district: "Coimbatore", state: "Tamil Nadu", circle: "Tamil Nadu" },

  // Kolkata & West Bengal
  "700001": { pincode: "700001", postOffice: "Kolkata G.P.O.", district: "Kolkata", state: "West Bengal", circle: "West Bengal" },
  "700091": { pincode: "700091", postOffice: "Salt Lake Sector V", district: "North 24 Parganas", state: "West Bengal", circle: "West Bengal" },

  // Ahmedabad & Gujarat
  "380001": { pincode: "380001", postOffice: "Ahmedabad G.P.O.", district: "Ahmedabad", state: "Gujarat", circle: "Gujarat" },
  "380015": { pincode: "380015", postOffice: "Satellite Road S.O", district: "Ahmedabad", state: "Gujarat", circle: "Gujarat" },
  "395001": { pincode: "395001", postOffice: "Surat H.O", district: "Surat", state: "Gujarat", circle: "Gujarat" },

  // Jaipur & Rajasthan
  "302001": { pincode: "302001", postOffice: "Jaipur G.P.O.", district: "Jaipur", state: "Rajasthan", circle: "Rajasthan" },
  "302017": { pincode: "302017", postOffice: "Malviya Nagar S.O", district: "Jaipur", state: "Rajasthan", circle: "Rajasthan" },

  // Lucknow & UP
  "226001": { pincode: "226001", postOffice: "Lucknow G.P.O.", district: "Lucknow", state: "Uttar Pradesh", circle: "Uttar Pradesh" },
  "226010": { pincode: "226010", postOffice: "Gomti Nagar S.O", district: "Lucknow", state: "Uttar Pradesh", circle: "Uttar Pradesh" },
  "208001": { pincode: "208001", postOffice: "Kanpur H.O", district: "Kanpur Nagar", state: "Uttar Pradesh", circle: "Uttar Pradesh" },
  "221001": { pincode: "221001", postOffice: "Varanasi H.O", district: "Varanasi", state: "Uttar Pradesh", circle: "Uttar Pradesh" },

  // Chandigarh & Punjab
  "160017": { pincode: "160017", postOffice: "Chandigarh Sector 17 H.O", district: "Chandigarh", state: "Chandigarh", circle: "Punjab" },
  "141001": { pincode: "141001", postOffice: "Ludhiana H.O", district: "Ludhiana", state: "Punjab", circle: "Punjab" },

  // Kerala
  "682001": { pincode: "682001", postOffice: "Ernakulam H.O (Kochi)", district: "Ernakulam", state: "Kerala", circle: "Kerala" },
  "695001": { pincode: "695001", postOffice: "Thiruvananthapuram G.P.O.", district: "Thiruvananthapuram", state: "Kerala", circle: "Kerala" },

  // Other Capitals
  "800001": { pincode: "800001", postOffice: "Patna G.P.O.", district: "Patna", state: "Bihar", circle: "Bihar" },
  "462001": { pincode: "462001", postOffice: "Bhopal G.P.O.", district: "Bhopal", state: "Madhya Pradesh", circle: "Madhya Pradesh" },
  "452001": { pincode: "452001", postOffice: "Indore G.P.O.", district: "Indore", state: "Madhya Pradesh", circle: "Madhya Pradesh" },
  "751001": { pincode: "751001", postOffice: "Bhubaneswar G.P.O.", district: "Khurda", state: "Odisha", circle: "Odisha" },
  "781001": { pincode: "781001", postOffice: "Guwahati G.P.O.", district: "Kamrup", state: "Assam", circle: "Assam" },
  "403001": { pincode: "403001", postOffice: "Panaji H.O", district: "North Goa", state: "Goa", circle: "Goa" },
  "248001": { pincode: "248001", postOffice: "Dehradun G.P.O.", district: "Dehradun", state: "Uttarakhand", circle: "Uttarakhand" },
  "171001": { pincode: "171001", postOffice: "Shimla G.P.O.", district: "Shimla", state: "Himachal Pradesh", circle: "Himachal Pradesh" },
  "190001": { pincode: "190001", postOffice: "Srinagar G.P.O.", district: "Srinagar", state: "Jammu & Kashmir", circle: "Jammu & Kashmir" },
  "834001": { pincode: "834001", postOffice: "Ranchi G.P.O.", district: "Ranchi", state: "Jharkhand", circle: "Jharkhand" },
  "492001": { pincode: "492001", postOffice: "Raipur H.O", district: "Raipur", state: "Chhattisgarh", circle: "Chhattisgarh" },
};

// State mapping based on Indian Postal Circle first 2 digits
function inferStateFromPincodePrefix(prefix: string): { state: string; circle: string } {
  const p = parseInt(prefix, 10);
  if (p === 11) return { state: "Delhi", circle: "Delhi" };
  if (p >= 12 && p <= 13) return { state: "Haryana", circle: "Haryana" };
  if (p >= 14 && p <= 15) return { state: "Punjab", circle: "Punjab" };
  if (p === 16) return { state: "Chandigarh", circle: "Punjab" };
  if (p === 17) return { state: "Himachal Pradesh", circle: "Himachal Pradesh" };
  if (p >= 18 && p <= 19) return { state: "Jammu & Kashmir", circle: "Jammu & Kashmir" };
  if (p >= 20 && p <= 28) return { state: "Uttar Pradesh", circle: "Uttar Pradesh" };
  if (p >= 24 && p <= 26) return { state: "Uttarakhand", circle: "Uttarakhand" };
  if (p >= 30 && p <= 34) return { state: "Rajasthan", circle: "Rajasthan" };
  if (p >= 36 && p <= 39) return { state: "Gujarat", circle: "Gujarat" };
  if (p >= 40 && p <= 44) return { state: "Maharashtra", circle: "Maharashtra" };
  if (p === 40) return { state: "Goa", circle: "Maharashtra" };
  if (p >= 45 && p <= 48) return { state: "Madhya Pradesh", circle: "Madhya Pradesh" };
  if (p === 49) return { state: "Chhattisgarh", circle: "Chhattisgarh" };
  if (p >= 50 && p <= 53) return { state: "Andhra Pradesh & Telangana", circle: "Telangana" };
  if (p >= 56 && p <= 59) return { state: "Karnataka", circle: "Karnataka" };
  if (p >= 60 && p <= 64) return { state: "Tamil Nadu", circle: "Tamil Nadu" };
  if (p >= 67 && p <= 69) return { state: "Kerala", circle: "Kerala" };
  if (p >= 70 && p <= 74) return { state: "West Bengal", circle: "West Bengal" };
  if (p >= 75 && p <= 77) return { state: "Odisha", circle: "Odisha" };
  if (p === 78) return { state: "Assam", circle: "Assam" };
  if (p === 79) return { state: "North Eastern States", circle: "North East" };
  if (p >= 80 && p <= 85) return { state: "Bihar & Jharkhand", circle: "Bihar" };
  return { state: "India", circle: "National Postal Circle" };
}

export function validateIndianPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

export async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  const cleanPin = pincode.trim();
  if (!validateIndianPincode(cleanPin)) return null;

  // 1. Direct local hit
  if (PINCODE_DATABASE[cleanPin]) {
    return PINCODE_DATABASE[cleanPin];
  }

  // 2. Fetch from India Post API if online
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      next: { revalidate: 86400 }, // cache 24h
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const info: PincodeInfo = {
          pincode: cleanPin,
          postOffice: po.Name,
          district: po.District,
          state: po.State,
          circle: po.Circle,
        };
        PINCODE_DATABASE[cleanPin] = info;
        return info;
      }
    }
  } catch {
    // network failure fallback
  }

  // 3. Heuristic fallback based on circle prefix
  const prefix = cleanPin.substring(0, 2);
  const inferred = inferStateFromPincodePrefix(prefix);
  return {
    pincode: cleanPin,
    postOffice: `Postal Office (${cleanPin})`,
    district: inferred.state,
    state: inferred.state,
    circle: inferred.circle,
  };
}
