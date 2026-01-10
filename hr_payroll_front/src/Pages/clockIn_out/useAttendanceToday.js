import { useEffect, useState } from "react";
import useAuth from "../../Context/AuthContext";
import { getLocalData } from "../../Hooks/useLocalStorage";

export default function useAttendanceToday() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [punches, setPunches] = useState([]);
  const [error, setError] = useState(null);
  const { axiosPrivate } = useAuth();

  async function load() {
    setLoading(true);
    setError(null);

    try {
      // console.log("here here here")
      const res = await axiosPrivate.get(`employees/${getLocalData("user_id")}/attendances/today/`);
      console.log(res?.data)
      setPunches(res.data?.punches || []);
      setStatus(res.data?.status || null);
    } catch (e) {
      setPunches([]);
      setStatus(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { loading, punches, status, error, refresh: load };
}
