const express = require('express');
const validator = require('validator');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 模擬 7-11 店舖數據（實際應用中應該調用 7-11 API）
const MOCK_STORES = [
  {
    storeNumber: '001234',
    storeName: '統一超商 台北車站門市',
    address: '台北市中正區北平西路3號1樓',
    phone: '02-2311-5566',
    district: '中正區',
    city: '台北市',
    openHours: '24小時營業',
    lat: 25.047924,
    lng: 121.517081,
    services: ['取貨付款', 'ibon', 'ATM'],
    isAvailable: true
  },
  {
    storeNumber: '002345',
    storeName: '統一超商 西門町門市',
    address: '台北市萬華區中華路一段108號',
    phone: '02-2311-7788',
    district: '萬華區',
    city: '台北市',
    openHours: '24小時營業',
    lat: 25.042543,
    lng: 121.507874,
    services: ['取貨付款', 'ibon', 'ATM', 'City Cafe'],
    isAvailable: true
  },
  {
    storeNumber: '003456',
    storeName: '統一超商 信義威秀門市',
    address: '台北市信義區松壽路20號B1',
    phone: '02-8780-3344',
    district: '信義區',
    city: '台北市',
    openHours: '10:00-22:00',
    lat: 25.036142,
    lng: 121.564157,
    services: ['取貨付款', 'ibon'],
    isAvailable: true
  },
  {
    storeNumber: '004567',
    storeName: '統一超商 東區忠孝門市',
    address: '台北市大安區忠孝東路四段223號',
    phone: '02-2711-5566',
    district: '大安區',
    city: '台北市',
    openHours: '24小時營業',
    lat: 25.041528,
    lng: 121.553918,
    services: ['取貨付款', 'ibon', 'ATM', 'City Cafe'],
    isAvailable: true
  },
  {
    storeNumber: '005678',
    storeName: '統一超商 師大夜市門市',
    address: '台北市大安區泰順街60號',
    phone: '02-2362-7799',
    district: '大安區',
    city: '台北市',
    openHours: '06:00-01:00',
    lat: 25.024935,
    lng: 121.529635,
    services: ['取貨付款', 'ibon'],
    isAvailable: true
  },
  {
    storeNumber: '006789',
    storeName: '統一超商 中山北路門市',
    address: '台北市中山區中山北路二段39號',
    phone: '02-2571-2288',
    district: '中山區',
    city: '台北市',
    openHours: '24小時營業',
    lat: 25.057464,
    lng: 121.520589,
    services: ['取貨付款', 'ibon', 'ATM'],
    isAvailable: true
  },
  {
    storeNumber: '007890',
    storeName: '統一超商 松山機場門市',
    address: '台北市松山區敦化北路340號B1',
    phone: '02-2712-3344',
    district: '松山區',
    city: '台北市',
    openHours: '05:00-23:00',
    lat: 25.063184,
    lng: 121.550748,
    services: ['取貨付款', 'ibon'],
    isAvailable: true
  },
  {
    storeNumber: '008901',
    storeName: '統一超商 內湖科技園區門市',
    address: '台北市內湖區瑞光路513號1樓',
    phone: '02-8797-5566',
    district: '內湖區',
    city: '台北市',
    openHours: '07:00-22:00',
    lat: 25.080176,
    lng: 121.579713,
    services: ['取貨付款', 'ibon', 'ATM', 'City Cafe'],
    isAvailable: true
  },
  {
    storeNumber: '009012',
    storeName: '統一超商 板橋車站門市',
    address: '新北市板橋區縣民大道二段7號B1',
    phone: '02-2959-6677',
    district: '板橋區',
    city: '新北市',
    openHours: '24小時營業',
    lat: 25.013875,
    lng: 121.463539,
    services: ['取貨付款', 'ibon', 'ATM'],
    isAvailable: true
  },
  {
    storeNumber: '010123',
    storeName: '統一超商 淡水老街門市',
    address: '新北市淡水區中正路15號',
    phone: '02-2621-8899',
    district: '淡水區',
    city: '新北市',
    openHours: '07:00-23:00',
    lat: 25.167355,
    lng: 121.440738,
    services: ['取貨付款', 'ibon'],
    isAvailable: true
  }
];

// 搜索店舖
router.get('/search', (req, res, next) => {
  try {
    const { 
      query, 
      city, 
      district, 
      lat, 
      lng, 
      radius = 5, 
      limit = 10 
    } = req.query;

    let stores = [...MOCK_STORES];

    // 按城市過濾
    if (city) {
      stores = stores.filter(store => 
        store.city.includes(city)
      );
    }

    // 按區域過濾
    if (district) {
      stores = stores.filter(store => 
        store.district.includes(district)
      );
    }

    // 按關鍵字搜索
    if (query) {
      const searchTerm = query.toLowerCase();
      stores = stores.filter(store => 
        store.storeName.toLowerCase().includes(searchTerm) ||
        store.address.toLowerCase().includes(searchTerm) ||
        store.storeNumber.includes(searchTerm)
      );
    }

    // 按距離過濾（如果提供了經緯度）
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = parseFloat(radius);

      stores = stores.map(store => {
        const distance = calculateDistance(
          userLat, userLng, 
          store.lat, store.lng
        );
        return { ...store, distance };
      }).filter(store => store.distance <= maxRadius)
        .sort((a, b) => a.distance - b.distance);
    }

    // 只顯示可用的店舖
    stores = stores.filter(store => store.isAvailable);

    // 限制結果數量
    stores = stores.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        stores,
        total: stores.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// 獲取所有店舖
router.get('/', (req, res, next) => {
  try {
    const { city, district, available } = req.query;
    
    let stores = [...MOCK_STORES];

    // 按城市過濾
    if (city) {
      stores = stores.filter(store => store.city === city);
    }

    // 按區域過濾
    if (district) {
      stores = stores.filter(store => store.district === district);
    }

    // 按可用性過濾
    if (available !== undefined) {
      const isAvailable = available === 'true';
      stores = stores.filter(store => store.isAvailable === isAvailable);
    }

    // 按城市和區域分組
    const groupedStores = stores.reduce((acc, store) => {
      if (!acc[store.city]) {
        acc[store.city] = {};
      }
      if (!acc[store.city][store.district]) {
        acc[store.city][store.district] = [];
      }
      acc[store.city][store.district].push(store);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        stores,
        grouped: groupedStores,
        total: stores.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// 獲取單個店舖詳情
router.get('/:storeNumber', (req, res, next) => {
  try {
    const { storeNumber } = req.params;
    
    const store = MOCK_STORES.find(s => s.storeNumber === storeNumber);
    
    if (!store) {
      throw new CustomError('店舖不存在', 404);
    }

    if (!store.isAvailable) {
      throw new CustomError('此店舖目前無法提供取貨服務', 400);
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    next(error);
  }
});

// 驗證店舖是否可用
router.post('/validate', (req, res, next) => {
  try {
    const { storeNumber } = req.body;

    if (!storeNumber) {
      throw new CustomError('請提供店舖編號', 400);
    }

    const store = MOCK_STORES.find(s => s.storeNumber === storeNumber);
    
    if (!store) {
      return res.json({
        success: false,
        message: '店舖編號不存在',
        isValid: false
      });
    }

    if (!store.isAvailable) {
      return res.json({
        success: false,
        message: '此店舖目前無法提供取貨服務',
        isValid: false
      });
    }

    res.json({
      success: true,
      message: '店舖可用',
      isValid: true,
      data: {
        storeNumber: store.storeNumber,
        storeName: store.storeName,
        address: store.address,
        phone: store.phone,
        openHours: store.openHours
      }
    });
  } catch (error) {
    next(error);
  }
});

// 獲取附近店舖
router.post('/nearby', (req, res, next) => {
  try {
    const { lat, lng, radius = 3, limit = 10 } = req.body;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new CustomError('請提供有效的經緯度座標', 400);
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxRadius = parseFloat(radius);

    const nearbyStores = MOCK_STORES
      .filter(store => store.isAvailable)
      .map(store => {
        const distance = calculateDistance(
          userLat, userLng, 
          store.lat, store.lng
        );
        return { ...store, distance };
      })
      .filter(store => store.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        stores: nearbyStores,
        total: nearbyStores.length,
        searchRadius: maxRadius,
        searchCenter: { lat: userLat, lng: userLng }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 獲取城市列表
router.get('/locations/cities', (req, res, next) => {
  try {
    const cities = [...new Set(MOCK_STORES.map(store => store.city))];
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    next(error);
  }
});

// 獲取指定城市的區域列表
router.get('/locations/districts/:city', (req, res, next) => {
  try {
    const { city } = req.params;
    
    const districts = [...new Set(
      MOCK_STORES
        .filter(store => store.city === city)
        .map(store => store.district)
    )];
    
    res.json({
      success: true,
      data: districts
    });
  } catch (error) {
    next(error);
  }
});

// 管理員：更新店舖狀態（模擬）
router.patch('/:storeNumber/status', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { storeNumber } = req.params;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      throw new CustomError('請提供有效的可用狀態', 400);
    }

    const storeIndex = MOCK_STORES.findIndex(s => s.storeNumber === storeNumber);
    
    if (storeIndex === -1) {
      throw new CustomError('店舖不存在', 404);
    }

    MOCK_STORES[storeIndex].isAvailable = isAvailable;

    res.json({
      success: true,
      message: '店舖狀態更新成功',
      data: {
        storeNumber,
        isAvailable
      }
    });
  } catch (error) {
    next(error);
  }
});

// 計算兩點間距離（公里）
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半徑（公里）
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 保留兩位小數
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router;
