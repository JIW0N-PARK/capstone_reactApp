import axios from 'axios';
import tideObsList from '../location/tideObsList.json';
import buObsList from '../location/buObsList.json';
import buoyList from '../location/Buoy.json';
import config from '../config/config.json';


const API_KEY = config.Observatory['API key'];
const Tide_Obs_URL = "http://www.khoa.go.kr/oceangrid/grid/api/tideObsRecent/search.do?"
const Bu_Obs_URL = "http://www.khoa.go.kr/oceangrid/grid/api/buObsRecent/search.do?"
const API_URL = "http://13.125.123.59:8080"
const SEA_URL = "https://www.weather.go.kr/weather/observation/marine_buoy.jsp"
export function getObservatoryData(latitude, longitude){
  var minTide = Number.MAX_SAFE_INTEGER;
  var minBu = Number.MAX_SAFE_INTEGER;
  var minTideObsCode = null;
  var minBuObsCode = null;

  tideObsList.positions.map((position) => {
    var calLat = (position.lat - latitude)**2;
    var calLng = (position.lng - longitude)**2;
    var sum = calLat + calLng;
    if(minTide > sum){
      minTide = sum;
      minTideObsCode = position.id;
    }
  });

  buoyList.positions.map((position) => {
    var calLat = (position.lat - latitude)**2;
    var calLng = (position.lng - longitude)**2;
    var sum = calLat + calLng;
    if(minBu > sum){
      minBu = sum;
      minBuObsCode = position.idx;
    }
  });

  return async (dispatch) => {
    let TIDE_OBS_DATA, accidentData
    axios.get(Tide_Obs_URL, {params: {
      ServiceKey: API_KEY,
      ObsCode: minTideObsCode,
      ResultType: "json"
    }}).then(({data}) => {
      TIDE_OBS_DATA = data.result.data;
      const wind_spd = TIDE_OBS_DATA.wind_speed != "null" ?  TIDE_OBS_DATA.wind_speed : 3
      const ats_pres = TIDE_OBS_DATA.air_press != "null" ?  TIDE_OBS_DATA.air_press : 1000
      const temp = TIDE_OBS_DATA.air_temp != "null" ?  TIDE_OBS_DATA.air_temp : 20
      const water_temp = TIDE_OBS_DATA.water_temp != "null" ?  TIDE_OBS_DATA.water_temp : 24 
      axios.get(API_URL+"/location", {
        params: {
          wind_spd ,
          ats_pres,
          temp,
          water_temp,
          idx: 1
        }
      }).then(({data}) => {
        data.prediction_ratio = parseInt(data.prediction_ratio.slice(0, data.prediction_ratio.length - 1))
        dispatch({
          type: 'SET_MODEL_DATA',
          payload1 : TIDE_OBS_DATA,
          payload2 : data
        })
      }).catch((error) => {
        console.log("ERROR : ", error);
      })
    }).catch((error) => {
      console.log('ERROR : ', error);
    });
  };
}
