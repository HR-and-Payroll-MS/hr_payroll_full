import React, { useState } from 'react'
import Example from '../../../Example/Example'
import CheckModal from '../../../Example/CheckModal'
import Modal from '../../../Components/Modal'
import Drawer from '../../../Components/Drawer'
import PDFViewer from '../../../Components/PDFViewer'

function Checklist() {



const [pdfBuffer, setPdfBuffer] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      setPdfBuffer(arrayBuffer);
    }
  };

  return (
    <div style={{ width: "600px", height: "800px", border: "1px solid #ccc" }}>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {pdfBuffer && <PDFViewer pdfData={pdfBuffer} containerId="pdf-container" />}
    </div>
  );
































      // const [isModalOpen , closeModal]=useState(true)
      // const [isDrawerOpen , setDrawerOpen]=useState(true)
      // const close = () => {
      //   setDrawerOpen(false)
      //   setTimeout(() => {
      //     closeModal(false)
          
      //   }, 400);
      // }
  // return (
    // <div><CheckModal/></div>


  //   <Modal isOpen={isModalOpen} >
  //     <Drawer isOpen={isDrawerOpen} onClose={() => close()}>
  //       <div>
          
  //       </div>
  //     </Drawer>
  // </Modal>

  

  // )
}

export default Checklist