// script.js

// Fungsi helper untuk memuat file template
function loadFile(url, callback) {
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => callback(null, data))
        .catch(error => callback(error));
}

// Variabel global untuk menyimpan data semua personil
let allPersonnel = [];
const personnelListDiv = document.getElementById('personnel-list');
const form = document.getElementById('spt-form');

// Fungsi untuk menampilkan daftar personil ke dalam checkbox
function displayPersonnel() {
    personnelListDiv.innerHTML = ''; // Kosongkan daftar
    allPersonnel.forEach(person => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'personnel-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `person-${person.nip}`;
        checkbox.value = person.nip;

        const label = document.createElement('label');
        label.htmlFor = `person-${person.nip}`;
        label.textContent = person.nama;

        const jabatanSpan = document.createElement('span');
        jabatanSpan.textContent = `(${person.jabatan})`;

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        itemDiv.appendChild(jabatanSpan);
        personnelListDiv.appendChild(itemDiv);
    });
}

// Muat data dari database.json saat halaman pertama kali dibuka
window.addEventListener('DOMContentLoaded', () => {
    fetch('database.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allPersonnel = data;
            displayPersonnel();
        })
        .catch(error => {
            console.error('Gagal memuat database personil:', error);
            personnelListDiv.innerHTML = '<p style="color:red;">Gagal memuat data personil. Pastikan file database.json ada dan formatnya benar.</p>';
        });
});


// Event listener saat form disubmit
form.addEventListener('submit', function(event) {
    event.preventDefault();

    // 1. Kumpulkan personil yang dipilih
    const selectedCheckboxes = document.querySelectorAll('#personnel-list input:checked');
    if (selectedCheckboxes.length === 0) {
        alert('Silakan pilih minimal satu personil yang akan ditugaskan.');
        return;
    }

    const selectedPersonnel = Array.from(selectedCheckboxes).map(checkbox => {
        return allPersonnel.find(p => p.nip === checkbox.value);
    });

    // 2. Pisahkan ketua dan anggota
    const leader = selectedPersonnel[0];
    const members = selectedPersonnel.slice(1);

    // 3. Kumpulkan semua data untuk template
    const tanggalMulai = new Date(document.getElementById('tanggal_mulai').value);
    const tanggalBerakhir = new Date(document.getElementById('tanggal_berakhir').value);
    const tanggalSurat = new Date(document.getElementById('tanggal_surat_dibuat').value);
    
    // Daftar bulan dalam Bahasa Indonesia
    const bulanIndonesia = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const dataForTemplate = {
        // Data Ketua Tim (sesuai permintaan Anda {nama_ketua})
        nama_ketua: leader.nama,
        pangkat_ketua: leader.pangkat,
        nip_ketua: leader.nip,
        jabatan_ketua: leader.jabatan,
        // Data Anggota Tim
        anggota: members,
        // Data Lain dari Form
        jenis_pengawasan: document.getElementById('jenis_pengawasan').value,
        dinas: document.getElementById('dinas').value,
        tahun_pengawasan: document.getElementById('tahun_pengawasan').value,
        tanggal_mulai: tanggalMulai.getDate(),
        tanggal_berakhir: tanggalBerakhir.getDate(),
        // Catatan: Template Anda memiliki {bulan_berlaku} dan {tahun_berlaku} terpisah.
        // Kita asumsikan ini merujuk pada bulan dan tahun dari tanggal berakhir tugas.
        bulan_berlaku: bulanIndonesia[tanggalBerakhir.getMonth()],
        tahun_berlaku: tanggalBerakhir.getFullYear(),
        // Data tanggal surat
        bulan: bulanIndonesia[tanggalSurat.getMonth()],
        tahun: tanggalSurat.getFullYear(),
        // Data Penanda Tangan
        jabatan_penandatangan: document.getElementById('jabatan_penandatangan').value,
        nama_penandatangan: document.getElementById('nama_penandatangan').value,
        pangkat_penandatangan: document.getElementById('pangkat_penandatangan').value,
        nip_penandatangan: document.getElementById('nip_penandatangan').value,
    };
    
    // Koreksi untuk template Anda {tanggal:berakhir}, sepertinya typo.
    // Jika benar-benar seperti itu, tambahkan: dataForTemplate['tanggal:berakhir'] = ...
    // Namun, saya asumsikan typo dan seharusnya {tanggal_berakhir}
    
    // 4. Proses pembuatan dokumen
    loadFile("template.docx", function(error, content) {
        if (error) {
            alert("Gagal memuat file template.docx");
            throw error;
        }

        const zip = new PizZip(content);
        const doc = new docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        try {
            doc.setData(dataForTemplate);
            doc.render();
            
            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            
            // Nama file dinamis
            const filename = `SPT - ${dataForTemplate.dinas} - ${new Date().toISOString().slice(0,10)}.docx`;
            saveAs(out, filename);

        } catch (renderError) {
            console.error("Error saat rendering template:", renderError);
            alert("Error saat membuat dokumen. Pastikan semua placeholder di template cocok dengan data.");
        }
    });
});