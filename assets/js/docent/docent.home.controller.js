(() => {
    'use strict';
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.clear();
      changeView('');
    }
  })();
  
  let payload = {
    title: '',
    type: '',
    userId: '',
    description: '',
    incidenceDate: '',
    status: {id: 4},
    annexes: [],
    location: {
        lat: 0,
        lng: 0,
    },
  };

  const camera = new Camera($('#player')[0]);
  const incidencesDocent =  new PouchDB('incidencesDocent');

  const cancelIncidence = () =>{};
  const editIncidence = () =>{};

  const currentLocation = () =>{
    toastMessage('Cargando mapa...').showToast();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) =>{
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            payload.location = {
                lat,
                lng,
            };
            showMapWithLocation(lat, lng);
        });
    }
  };




  const showMapWithLocation = (lat, lng) =>{
    let content = 
    `<iframe
        width ="100%" height="250"
        frameborder="0" scrolling="no"
        marginheight="0" marginwidth="0"
        src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=es&amp;q=${lat},${lng}+(Prueba)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
        >
        </iframe>
        `;
        document.getElementById('modal-map').innerHTML = '';
        document.getElementById('modal-map').innerHTML = content;
  };

  const initializeCamera = () =>{
    toastMessage('Encendiendo camara..').showToast();
    $('#modal-camera').css('display', 'block');
    camera.powerOn();
  }

  const takeAPhoto = () =>{
    const photo = camera.takeAPhoto();
    const tipoMIME = photo.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
    const mimeType = tipoMIME[1].split('/')[1];
    const base64 = photo.split(',')[1]

    payload = {...payload, annexes: [{name: 'Foto', mimeType: mimeType, file: base64}]};
    camera.powerOff();
  }


    const submitIncidenceForm = async(event)=>{
      event.preventDefault();
      payload.title = document.getElementById('title').value;
      payload.type = document.getElementById('type').value;
      payload.description =  document.getElementById('description').value;     
      const date = document.getElementById('incidenceDate').value.split('T');
      payload.incidenceDate =  `${date[0]} ${date[1]}`; 
      payload.userId = parseJWT().areas[0].id

      try{
        const response = await axiosClient.post('/incidences/save',payload);
        toastMessage('Se ha registado la incidencia exitosamente').showToast();
      }catch(e){
        toastMessage('Error al registrar la incidencia').showToast();
      }
    }
  

  const getAllIncidencesByEmployee = async () => {
    try {
      const table = $('#incidencesTable').DataTable();
      table.destroy();
      const user = parseJWT();
      console.log(user);
      const response = await axiosClient.get(`/incidences/${user.id}`);
      const incidences = document.getElementById('ownIncidences');
      let content = ``;
      incidences.innerHTML = ``;
      const { rows } = await incidencesDocent.allDocs({ include_docs: true });
      for (const [i, incidence] of response?.incidences.entries()) {
        const date = new Date(incidence.incidenceDate);
        const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit day
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two-digit month (months are zero-based)
        const year = date.getFullYear();
        content += `
          <tr>
            <th scope="row">${i + 1}</th>
            <td>${
              incidence.person.name +
              ' ' +
              incidence.person.surname +
              ' ' +
              (incidence.person.lastname ?? '')
            }</td>
            <td>${incidence.user.area.name}</td>
            <td>${day}-${month}-${year}</td>
            <td><span class="badge bg-info">${
              incidence.status.description
            }</span></td>
            <td>
              <button onclick="editIncidence(${i})" class="btn btn-warning btn-sm">EDITAR</button>
              <button onclick="cancelIncidence(${i})" class="btn btn-danger btn-sm">CANCELAR</button>
            </td>
          </tr>
          `;
      }
      incidences.innerHTML = content;
      new DataTable($('#incidencesTable'), {
        columnDefs: [{ orderable: false, targets: 4 }],
        language: {
          url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json',
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  $(document).ready(function () {
    if (!fullname) fullname = localStorage.getItem('fullname');
    if (!role) role = localStorage.getItem('activeRole');
    $('#fullname').text(fullname);
    $('#fullname2').text(fullname);
    $('#role').text(role);
    getAllIncidencesByEmployee();
    navigator.serviceWorker.addEventListener('message',(event) =>{
        if (event.data && event.data.type === 'RELOAD_PAGE_AFTER_SYNC') 
        window.location.reload(true);       
    });
  });