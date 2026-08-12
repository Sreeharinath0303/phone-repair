const BRAND_FALLBACKS = {
  smartphone: [
    'Apple', 'Samsung', 'Vivo', 'Oppo', 'Xiaomi', 'Realme', 'OnePlus', 'Google', 'Nothing', 'Motorola',
    'Nokia', 'Poco', 'IQOO', 'Infinix', 'Tecno', 'Huawei', 'Honor', 'Asus', 'Sony', 'Lava', 'Other'
  ],
  tablet: ['Apple', 'Samsung', 'Lenovo', 'Xiaomi', 'Realme', 'Honor', 'Huawei', 'Other'],
  laptop: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Samsung', 'Microsoft', 'Other'],
  smartwatch: ['Apple', 'Samsung', 'Garmin', 'Fossil', 'Fitbit', 'Amazfit', 'Noise', 'boAt', 'Other']
};

const MODEL_FALLBACKS = {
  smartphone: {
    Apple: [
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      'iPhone SE (3rd Gen)', 'iPhone SE (2nd Gen)', 'Other Model'
    ],
    Samsung: [
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
      'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
      'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
      'Galaxy S21 Ultra', 'Galaxy S21 FE',
      'Galaxy Z Fold 5', 'Galaxy Z Fold 4', 'Galaxy Z Fold 3',
      'Galaxy Z Flip 5', 'Galaxy Z Flip 4', 'Galaxy Z Flip 3',
      'Galaxy A55', 'Galaxy A54', 'Galaxy A53', 'Galaxy A35', 'Galaxy A34', 'Galaxy A15', 'Galaxy M34', 'Other Model'
    ],
    Vivo: ['Vivo X100 Pro', 'Vivo X100', 'Vivo X90 Pro', 'Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo V29', 'Vivo T3', 'Vivo T2 Pro', 'Vivo Y200', 'Other Model'],
    Oppo: ['Oppo Find X7 Ultra', 'Oppo Find X7', 'Oppo Find N3 Flip', 'Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo Reno 10 Pro', 'Oppo F27', 'Oppo F25 Pro', 'Oppo A79', 'Other Model'],
    Xiaomi: ['Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro', 'Redmi 13C', 'Redmi 12', 'Other Model'],
    Realme: ['Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12', 'Realme GT 6', 'Realme GT 5 Pro', 'Realme Narzo 70 Pro', 'Realme Narzo 60', 'Realme C67', 'Other Model'],
    OnePlus: ['OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus Open', 'OnePlus Nord 3', 'OnePlus Nord CE 4', 'OnePlus Nord CE 3 Lite', 'Other Model'],
    Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 8a', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel Fold', 'Pixel 6 Pro', 'Pixel 6a', 'Other Model'],
    Nothing: ['Nothing Phone (2)', 'Nothing Phone (2a)', 'Nothing Phone (1)', 'Other Model'],
    Motorola: ['Moto Edge 50 Pro', 'Moto Edge 40 Neo', 'Moto Razr 40 Ultra', 'Moto G84', 'Moto G54', 'Moto G34', 'Other Model'],
    Nokia: ['Nokia G42', 'Nokia X30', 'Nokia C32', 'Nokia G22', 'Other Model'],
    Poco: ['Poco F6 Pro', 'Poco F6', 'Poco X6 Pro', 'Poco X6', 'Poco M6 Pro', 'Poco C65', 'Other Model'],
    IQOO: ['iQOO 12', 'iQOO Neo 9 Pro', 'iQOO Neo 7 Pro', 'iQOO Z9', 'iQOO Z7 Pro', 'Other Model'],
    Infinix: ['Infinix Note 40 Pro', 'Infinix GT 20 Pro', 'Infinix Zero 30', 'Infinix Hot 40', 'Other Model'],
    Tecno: ['Tecno Phantom V Fold', 'Tecno Camon 30 Pro', 'Tecno Camon 20', 'Tecno Pova 6 Pro', 'Tecno Spark 20', 'Other Model'],
    Huawei: ['Huawei Pura 70 Ultra', 'Huawei P60 Pro', 'Huawei Mate 60 Pro', 'Huawei Nova 12', 'Other Model'],
    Honor: ['Honor Magic 6 Pro', 'Honor Magic V2', 'Honor 200 Pro', 'Honor 200', 'Honor X9b', 'Honor 90', 'Other Model'],
    Asus: ['ROG Phone 8 Pro', 'ROG Phone 8', 'ROG Phone 7', 'Zenfone 11 Ultra', 'Zenfone 10', 'Other Model'],
    Sony: ['Xperia 1 V', 'Xperia 5 V', 'Xperia 10 V', 'Xperia 1 IV', 'Other Model'],
    Lava: ['Lava Agni 2', 'Lava Blaze Curve', 'Lava Blaze 2 5G', 'Lava Storm 5G', 'Other Model'],
    Other: ['Other Model']
  },
  tablet: {
    Apple: [
      'iPad Pro 13-inch (M4)', 'iPad Pro 11-inch (M4)', 'iPad Pro 12.9-inch (6th Gen)',
      'iPad Air 13-inch (M2)', 'iPad Air 11-inch (M2)', 'iPad Air (5th Gen)',
      'iPad (10th Gen)', 'iPad (9th Gen)', 'iPad mini (6th Gen)', 'Other Model'
    ],
    Samsung: [
      'Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S9 FE',
      'Galaxy Tab S8 Ultra', 'Galaxy Tab S8+', 'Galaxy Tab S8',
      'Galaxy Tab A9+', 'Galaxy Tab A9', 'Galaxy Tab A8', 'Other Model'
    ],
    Lenovo: ['Tab P12 Pro', 'Tab P12', 'Tab P11 Pro', 'Tab M11', 'Tab M10 Plus', 'Tab M9', 'Legion Y700', 'Other Model'],
    Xiaomi: ['Xiaomi Pad 6S Pro', 'Xiaomi Pad 6', 'Xiaomi Pad 5', 'Redmi Pad SE', 'Redmi Pad', 'Other Model'],
    Realme: ['Realme Pad 2', 'Realme Pad X', 'Realme Pad Mini', 'Other Model'],
    Honor: ['Honor Pad 9', 'Honor Pad X9', 'Honor Pad 8', 'Other Model'],
    Huawei: ['MatePad Pro 13.2', 'MatePad Pro 11', 'MatePad 11.5', 'MatePad SE', 'Other Model'],
    Other: ['Other Model']
  },
  laptop: {
    Apple: [
      'MacBook Air 13" (M3)', 'MacBook Air 15" (M3)', 'MacBook Air 13" (M2)', 'MacBook Air 15" (M2)', 'MacBook Air (M1)',
      'MacBook Pro 14" (M3)', 'MacBook Pro 16" (M3)', 'MacBook Pro 14" (M2)', 'MacBook Pro 16" (M2)',
      'MacBook Pro 13" (M2)', 'MacBook Pro 14" (M1)', 'MacBook Pro 16" (M1)', 'Other Model'
    ],
    Dell: [
      'XPS 13', 'XPS 14', 'XPS 16', 'XPS 15',
      'Inspiron 14', 'Inspiron 15', 'Inspiron 16',
      'Alienware m16', 'Alienware m18', 'Alienware x14',
      'Latitude 5440', 'Latitude 7440', 'Precision 3580', 'Other Model'
    ],
    HP: [
      'Spectre x360 14', 'Spectre x360 16',
      'Envy x360', 'Envy 16',
      'Pavilion 14', 'Pavilion 15', 'Pavilion Aero 13',
      'Omen 16', 'Omen Transcend 14', 'Victus 15', 'Victus 16',
      'EliteBook 840', 'ProBook 450', 'Other Model'
    ],
    Lenovo: [
      'ThinkPad X1 Carbon', 'ThinkPad T14', 'ThinkPad E14', 'ThinkPad E16',
      'Yoga 9i', 'Yoga 7i', 'Yoga Pro 9i',
      'IdeaPad Slim 5', 'IdeaPad Slim 3', 'IdeaPad Flex 5',
      'Legion Pro 7i', 'Legion Pro 5i', 'Legion Slim 5', 'LOQ 15', 'Other Model'
    ],
    Asus: [
      'Zenbook 14 OLED', 'Zenbook Pro 14 Duo',
      'Vivobook 15', 'Vivobook 16X', 'Vivobook S 15',
      'ROG Zephyrus G14', 'ROG Zephyrus G16', 'ROG Strix SCAR 16',
      'TUF Gaming A15', 'TUF Gaming F15', 'ExpertBook B5', 'Other Model'
    ],
    Acer: [
      'Swift X 14', 'Swift Go 14', 'Swift 3',
      'Aspire 5', 'Aspire 7', 'Aspire 3',
      'Predator Helios 16', 'Predator Helios Neo 16',
      'Nitro V 15', 'Nitro 5', 'Other Model'
    ],
    MSI: ['Titan 18 HX', 'Raider GE78', 'Stealth 14', 'Stealth 16', 'Katana 15', 'Cyborg 15', 'GF63 Thin', 'Prestige 16', 'Modern 14', 'Other Model'],
    Samsung: ['Galaxy Book4 Ultra', 'Galaxy Book4 Pro', 'Galaxy Book4 Pro 360', 'Galaxy Book3 Ultra', 'Galaxy Book3 Pro', 'Galaxy Book2', 'Other Model'],
    Microsoft: ['Surface Laptop 6', 'Surface Laptop 5', 'Surface Laptop Go 3', 'Surface Pro 10', 'Surface Pro 9', 'Surface Laptop Studio 2', 'Other Model'],
    Other: ['Other Model']
  },
  smartwatch: {
    Apple: ['Apple Watch Ultra 2', 'Apple Watch Ultra', 'Apple Watch Series 9', 'Apple Watch Series 8', 'Apple Watch Series 7', 'Apple Watch SE (2nd Gen)', 'Other Model'],
    Samsung: ['Galaxy Watch 6 Classic', 'Galaxy Watch 6', 'Galaxy Watch 5 Pro', 'Galaxy Watch 5', 'Galaxy Watch 4 Classic', 'Galaxy Watch 4', 'Other Model'],
    Garmin: ['Fenix 7 Pro', 'Epix Pro (Gen 2)', 'Forerunner 965', 'Forerunner 265', 'Venu 3', 'Venu Sq 2', 'Instinct 2', 'Other Model'],
    Fossil: ['Gen 6 Wellness Edition', 'Gen 6', 'Hybrid HR', 'Other Model'],
    Fitbit: ['Sense 2', 'Versa 4', 'Charge 6', 'Charge 5', 'Inspire 3', 'Other Model'],
    Amazfit: ['Cheetah Pro', 'GTR 4', 'GTS 4', 'T-Rex Ultra', 'T-Rex 2', 'Bip 5', 'Active', 'Other Model'],
    Noise: ['ColorFit Pro 5 Max', 'ColorFit Pro 5', 'ColorFit Ultra 3', 'Halo Plus', 'Other Model'],
    boAt: ['Lunar Pro LTE', 'Xtend Pro', 'Wave Sigma', 'Storm Call 3', 'Other Model'],
    Other: ['Other Model']
  }
};

module.exports = {
  BRAND_FALLBACKS,
  MODEL_FALLBACKS
};
