// تعريف المتغيرات الأساس// تعريف المتغيرات الأساسية
const botToken = '2094023494:AAEpX9YYAv0mWx5qR3a2HJV5g_r9XbTrjNo';
const chatId = '@segabaghdad';
let currentRestaurant = JSON.parse(localStorage.getItem('currentRestaurant')) || null;

const restaurants = [
    'ازبريي شارع فلسطين',
    'كوددت',
    'المختار الااراكَيل',
    'عيادة الميار شارع فلسطين',
    'زهور فانيلا',
    'مينا روز شارع فلسطين',
    'تجهيزات الملكة',
    'test',
    'فايرفاير شارع فلسطين',
    'لحم بعجين الموصلي شارع فلسطين',
    'دونير زون',
    'المراعي شارع فلسطين',
    'بيت المندي اليمني شارع فلسطين',
    'ويست برغر القاهرة',
    'توتاروز شارع فلسطين',
    'اوكي بيتزا شارع فلسطين',
    'مطعم وكافيه روزا شارع فلسطين',
    'دايتي شارع فلسطين',
    'أسماك طبوش',
    'كَوست ڤيب',
    'لحوم السراي',
    'AFC القاهرة',
    'فلافل لبنان شارع فلسطين2',
    'مشويات ابووطن شارع فلسطين',
    'تجربه'
    
];

// ترتيب المطاعم أبجدياً
const sortedRestaurants = restaurants.sort((a, b) => a.localeCompare(b, 'ar'));

console.log(sortedRestaurants);

// دالة لتحميل بيانات المطعم
async function loadRestaurantData(restaurantName) {
    try {
        const response = await fetch(`restaurants/${restaurantName}/data.json`);
        if (!response.ok) throw new Error('حدث خطأ أثناء تحميل بيانات المطعم');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`خطأ في تحميل بيانات المطعم ${restaurantName}:`, error);
        throw error;
    }
}

// دالة لتسجيل الدخول
async function login(email, password) {
    const emailLower = email.toLowerCase();  // تحويل البريد الإلكتروني المدخل إلى أحرف صغيرة
    for (const restaurantName of restaurants) {
        try {
            const { credentials, areas, restaurantDetails } = await loadRestaurantData(restaurantName);
            if (credentials.email.toLowerCase() === emailLower && credentials.password === password) {  // تحويل البريد الإلكتروني المحفوظ إلى أحرف صغيرة أيضًا
                currentRestaurant = { name: restaurantName, areas, restaurantDetails };
                localStorage.setItem('currentRestaurant', JSON.stringify(currentRestaurant));
                
                // تهيئة صفحة الطلبات
                initializeOrderPage();

                // تحديث مجموع رسوم الخدمة بعد تسجيل الدخول
                updateServiceFeeTotal();

                showSuccessMessage('تم تسجيل الدخول بنجاح.');
                return;
            }
        } catch (error) {
            console.error('خطأ:', error);
        }
    }
    showErrorMessage('بيانات الدخول غير صحيحة.');
}


// دالة لتهيئة صفحة الطلب بعد تسجيل الدخول
function initializeOrderPage() {
    document.getElementById('restaurantName').textContent = currentRestaurant.name;
    document.getElementById('restaurantName').style.display = 'block';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('orderContainer').style.display = 'block';

    const locationSelect = document.getElementById('location');
    locationSelect.innerHTML = '<option value="">اختر المنطقة</option>';
    currentRestaurant.areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area.name;
        option.textContent = area.name;
        locationSelect.appendChild(option);
    });

    locationSelect.addEventListener('change', function() {
        const selectedArea = currentRestaurant.areas.find(area => area.name === this.value);
        document.getElementById('price').value = selectedArea ? selectedArea.price : '';
    });

    // تحديث رسوم الخدمة في صفحة الطلب بعد تسجيل الدخول
    document.getElementById('serviceFee').value = `${currentRestaurant.restaurantDetails.serviceFee || 500} دينار`;
}


// دالة لحفظ الطلب في localStorage
function saveOrder(order) {
    const ordersKey = `${currentRestaurant.name}_orders`;
    const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    existingOrders.push(order);
    localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
    console.log('تم حفظ الطلب بنجاح في localStorage.');
}


// دالة لإرسال رسالة إلى Telegram
async function sendMessageToTelegram(order) {
    const date = new Date(order.date);
    const formattedDate = date.toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // الحصول على رابط موقع المطعم من restaurantDetails.location
    const restaurantLocation = currentRestaurant.restaurantDetails.location || 'غير متوفر';

    const message = `
*📦 طلب جديد من  ${currentRestaurant.name}*

*🔢 رقم الزبون:* \`${order.customerNumber}\`
*🌍 المنطقة:* ${order.location}
*💵 كلفة التوصيل:* ${order.price} دينار
*🍽️ سعر الطلب:* ${order.orderPrice} دينار
*📝 ملاحظة:* ${order.note || 'لا يوجد'}

*🔢 رقم الطلب:* ${order.orderDigits || 'غير متوفر'}

*📍 موقع المطعم:* ${restaurantLocation}

*📅 التاريخ:* ${formattedDate}  
*🕒 الوقت:* ${formattedTime}
`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) throw new Error('فشل في إرسال الرسالة إلى Telegram');
        console.log('تم إرسال الرسالة إلى Telegram بنجاح.');
        showSuccessMessage('تم إرسال الطلب بنجاح وسيصل السائق خلال 10 دقائق أو أقل.');
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        showErrorMessage('حدث خطأ بسبب عدم اتصالك بالإنترنت أو غيرها. لم يتم إرسال الطلب. يرجى المحاولة مرة أخرى.');
    }
}


// دالة لمعالجة إرسال الطلب
async function handleOrderSubmission() {
    const customerNumber = document.getElementById('customerNumber').value.trim();
    const location = document.getElementById('location').value;
    const price = document.getElementById('price').value.trim();
    const orderPrice = document.getElementById('orderPrice').value.trim();
    const note = document.getElementById('note').value.trim();
    const orderDigits = document.getElementById('orderLastFourDigits').value.trim();
    
    // الحصول على رسوم الخدمة الخاصة بالمطعم
    const serviceFee = currentRestaurant.restaurantDetails.serviceFee || 500; // استخدام 500 دينار كقيمة افتراضية إذا لم توجد رسوم خدمة
    
    // التحقق من صحة البيانات المدخلة
    if (!validateOrderForm(customerNumber, location, price, orderPrice, orderDigits)) return;

    const order = {
        customerNumber,
        location,
        price,
        orderPrice,
        note,
        orderDigits,
        serviceFee,  // إضافة رسوم الخدمة الخاصة بالمطعم
        date: new Date(),
        restaurantDetails: currentRestaurant.restaurantDetails
    };

    // إرسال الطلب إلى Telegram وحفظه في localStorage
    await sendMessageToTelegram(order);
    saveOrder(order);

    // تحديث مجموع رسوم الخدمة
    updateServiceFeeTotal();

    // تنظيف الحقول بعد الإرسال الناجح
    resetOrderForm();
}


// دالة للتحقق من صحة نموذج الطلب
function validateOrderForm(customerNumber, location, price, orderPrice, orderDigits) {
    let isValid = true;

    // التحقق من أن الحقل ليس فارغًا فقط، بدون فحص الصيغة أو الطول
    if (!customerNumber) {
        showFieldError('customerNumberError', 'يرجى إدخال رقم الزبون.');
        isValid = false;
    } else {
        hideFieldError('customerNumberError');
    }

    if (!location) {
        showFieldError('locationError', 'يرجى اختيار المنطقة.');
        isValid = false;
    } else {
        hideFieldError('locationError');
    }

    if (!orderPrice || isNaN(orderPrice)) {
        showFieldError('orderPriceError', 'يرجى إدخال سعر طلب صحيح.');
        isValid = false;
    } else {
        hideFieldError('orderPriceError');
    }

    // التحقق من رقم الطلب إذا كان موجوداً، لكنه ليس إلزامياً
    if (orderDigits && (orderDigits.length < 1 || orderDigits.length > 24 || isNaN(orderDigits))) {
        showFieldError('orderLastFourDigitsError', 'يرجى إدخال رقم طلب صحيح من 2 إلى 24 أرقام.');
        isValid = false;
    } else {
        hideFieldError('orderLastFourDigitsError');
    }

    return isValid;
}

function updateServiceFeeTotal() {
    const ordersKey = `${currentRestaurant.name}_orders`;
    const existingOrders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    // حساب مجموع رسوم الخدمة بناءً على الطلبات المخزنة
    const totalServiceFee = existingOrders.reduce((sum, order) => sum + (order.serviceFee || 0), 0);

    // تحديث مجموع رسوم الخدمة في العنصر على الشاشة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
}



// دوال لعرض وإخفاء رسائل الخطأ في الحقول
function showFieldError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function hideFieldError(elementId) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.style.display = 'none';
}

// دالة لتنظيف نموذج الطلب بعد الإرسال
function resetOrderForm() {
    document.getElementById('customerNumber').value = '';
    document.getElementById('location').value = '';
    document.getElementById('price').value = '';
    document.getElementById('orderPrice').value = '';
    document.getElementById('note').value = '';
    document.getElementById('orderLastFourDigits').value = '';
} 

$(document).ready(function() {
    // إظهار رسالة الصيانة لمدة 5 ثوانٍ ثم إخفائها
    $('#maintenanceMessage').show();
    setTimeout(function() {
        $('#maintenanceMessage').fadeOut();
    }, 2000); // إخفاء الرسالة بعد 5 ثوانٍ
});

$(document).ready(function() {
    // إظهار رسالة الصيانة
    $('#maintenanceMessage').show();
    
    // تحديث مجموع رسوم الخدمة عند تحميل الصفحة
    if (currentRestaurant) {
        updateServiceFeeTotal();
    }
});


// دوال لعرض رسائل النجاح والخطأ
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 6000);
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 6000);
}



// دالة لعرض سجل الطلبات
function displayOrders() {
    if (!currentRestaurant) {
        showErrorMessage('يرجى تسجيل الدخول أولاً لعرض سجل الطلبات.');
        return;
    }

    const ordersKey = `${currentRestaurant.name}_orders`;
    const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];

    if (orders.length === 0) {
        showErrorMessage('لا توجد طلبات مسجلة لهذا المطعم.');
        return;
    }

    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = ''; // تنظيف الجدول

    // عرض جميع الطلبات
    orders.reverse().forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.customerNumber}</td>
            <td>${order.location}</td>
            <td>${order.price} دينار</td>
            <td>${order.orderPrice} دينار</td>
            <td>${order.serviceFee} دينار</td> <!-- إضافة رسوم الخدمة -->
            <td>${order.note || '-'}</td>
            <td>${order.orderDigits}</td>
            <td>${new Date(order.date).toLocaleString('ar-IQ')}</td>
        `;
        ordersList.appendChild(row);
    });
    
    // حساب ملخص الطلبات
    calculateOrderSummary(orders);

    // عرض النافذة المنبثقة لسجل الطلبات
    document.getElementById('ordersModal').style.display = 'block';
    initializeDataTable();
}

// دالة لتفعيل DataTable على جدول الطلبات
function initializeDataTable() {
    $('#ordersTable').DataTable({
        retrieve: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json'
        },
        pageLength: 2, // عدد الطلبات الظاهرة في كل صفحة
        lengthMenu: [5, 10, 15, 20, 50, 100], // خيارات أعداد الطلبات للعرض
    });
}


// دالة لحساب ملخص الطلبات
function calculateOrderSummary(orders) {
    const totalOrders = orders.length;

    const today = new Date();
    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.toDateString() === today.toDateString();
    }).length;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weeklyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= weekStart;
    }).length;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= monthStart;
    }).length;

    // حساب مجموع رسوم الخدمة من الطلبات المخزنة
    const totalServiceFee = orders.reduce((sum, order) => sum + (order.serviceFee || 0), 0);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('todayOrders').textContent = todayOrders;
    document.getElementById('weeklyOrders').textContent = weeklyOrders;
    document.getElementById('monthlyOrders').textContent = monthlyOrders;
    
    // تحديث مجموع رسوم الخدمة
    document.getElementById('serviceFeeTotal').textContent = `${totalServiceFee} دينار`;
}


// دالة لتفعيل DataTable على جدول الطلبات
function initializeDataTable() {
    $('#ordersTable').DataTable({
        retrieve: true,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.3/i18n/ar.json'
        },
        pageLength: 2, // عدد الطلبات الظاهرة في كل صفحة
        lengthMenu: [2, 5, 10, 15, 20], // خيارات أعداد الطلبات للعرض
    });
}

// دالة لتسجيل الخروج مع إظهار رسالة تأكيد مخصصة
function showLogoutConfirmation() {
    // إظهار نافذة التأكيد المخصصة
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'block';

    const confirmBtn = document.getElementById('confirmLogoutBtn');

    // دالة لتحريك الزر إلى مكان عشوائي داخل الإطار الأحمر
    function moveButtonRandomly() {
        const modalContent = document.querySelector('.modal-content');
        const maxWidth = modalContent.clientWidth - confirmBtn.clientWidth - 20; // تحديد أقصى عرض للحركة
        const maxHeight = modalContent.clientHeight - confirmBtn.clientHeight - 20; // تحديد أقصى ارتفاع للحركة
        
        const randomX = Math.floor(Math.random() * maxWidth / 4) + 10; // تقليل المسافة الأفقية للحركة
        const randomY = Math.floor(Math.random() * maxHeight / 4) + 10; // تقليل المسافة العمودية للحركة
        
        confirmBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
    }

    // عند محاولة النقر على زر "نعم"، تحركه بشكل عشوائي داخل الإطار
    confirmBtn.onmouseover = function() {
        moveButtonRandomly();
    };

    // عند النقر على زر "نعم" بعد محاولة الوصول إليه
    confirmBtn.onclick = function() {
        modal.style.display = 'none';
        logout(); // استدعاء دالة تسجيل الخروج
    };

    // عند النقر على زر "لا" لإلغاء تسجيل الخروج
    document.getElementById('cancelLogoutBtn').onclick = function() {
        modal.style.display = 'none';
    };
}


// دالة لتسجيل الخروج
function logout() {
    currentRestaurant = null;
    localStorage.removeItem('currentRestaurant');
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('orderContainer').style.display = 'none';
    showSuccessMessage('تم تسجيل الخروج بنجاح.');
}

// إعداد مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (currentRestaurant) {
        initializeOrderPage();
    }

    // مستمع زر تسجيل الدخول
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        login(email, password);
    });

    // مستمع زر إرسال الطلب
    document.getElementById('submitOrder').addEventListener('click', function(e) {
        e.preventDefault();
        handleOrderSubmission();
    });

    // مستمع زر عرض سجل الطلبات
    document.getElementById('showOrders').addEventListener('click', function(e) {
        e.preventDefault();
        displayOrders();
    });

    // مستمع زر إغلاق نافذة السجل
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('ordersModal').style.display = 'none';
    });

    // مستمع زر تسجيل الخروج مع إظهار رسالة التأكيد المخصصة
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        showLogoutConfirmation();
    });
});
