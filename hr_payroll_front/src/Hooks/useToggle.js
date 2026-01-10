import React from 'react'
import PropTypes from 'prop-types'

function useToggle(initialValue = false) {
    const [value, setValue] = useState (initialValue);
    const toggle=()=>setValue((prev)=>!prev);
  return [value, toggle];
}


export default useToggle


//using it there
//const [isVisible, toggleVisible]=useToggle(false);
{/* <button onClick ={toggleVisible}/>
    {isVissible && <xxxxxxxxxxxxxxxx>}
     */}