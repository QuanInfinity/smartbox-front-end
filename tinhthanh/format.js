import { provinces } from "./TinhThanh.js";
import { districts } from "./QuanHuyen.js";
import { wards } from "./PhuongXa.js";
import clipboard from "clipboardy";

const provincesMap = new Map();
const districtsMap = new Map();

getProvincesQuery();
getDistrictsQuery();
getWardsQuery();

async function getProvincesQuery() {
  let result = "";

  provinces.map((p, index) => {
    const id = index + 1;
    const name = p.name.replace(/^(Tỉnh |Thành phố )/, "");
    const code = p.code;
    const c = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    const query = `insert into provinces (ProvinceName, StateCode) values ('${name}', '${c}');\n`;
    result += query;

    if (!provincesMap.has(code)) {
      provincesMap.set(code, id);
    } else {
      throw `province: ${code} - ${id} - exists`;
    }
  });

  clipboard.writeSync(result);
}

function getDistrictsQuery() {
  let result = "";

  districts.map((d, index) => {
    const id = index + 1;
    const name = d.name;
    const code = d.code;
    const pId = provincesMap.get(d.province_code);
    const query = `insert into districts (ProvinceId, DistrictName, IsActive) values (${pId}, "${name}", 1);\n`;
    result += query;

    if (!districtsMap.has(code)) {
      districtsMap.set(code, id);
    } else {
      throw `districts ${code} - ${id} - exists`;
    }
  });

  clipboard.writeSync(result);
}

function getWardsQuery() {
  let result = "insert into wards (DistrictId, WardName, IsActive) values\n";

  wards.map((w) => {
    const name = w.name;
    const dId = districtsMap.get(w.district_code);
    const query = `(${dId}, "${name}", 1),\n`;
    result += query;
  });

  clipboard.writeSync(result);
}
