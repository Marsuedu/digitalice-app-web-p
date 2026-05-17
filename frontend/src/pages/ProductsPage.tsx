import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { productsApi, teachersApi } from '../api/domainApi';
import { Button } from '../components/ui/Button';
import { Field, SelectField } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { useAsyncData } from '../hooks/useAsyncData';
import type { Product, ProductStatus, ProductType, Teacher } from '../types';
import { firstMissing } from '../utils/validation';

type ProductForm = {
  codigo: string;
  nombre: string;
  tipo: ProductType;
  institucion: string;
  monto_referencial: string;
  estado: ProductStatus;
};

type ModuleForm = {
  nombre_oficial: string;
  docente_id: string;
};

const emptyForm: ProductForm = {
  codigo: '',
  nombre: '',
  tipo: 'DIPLOMADO',
  institucion: 'DIGITALICE',
  monto_referencial: '',
  estado: 'POR_INICIAR',
};

const productStatusLabels: Record<ProductStatus, string> = {
  POR_INICIAR: 'Por iniciar',
  ACTIVO: 'Activo',
  FINALIZADO: 'Finalizado',
};

function productStatus(product: Product): ProductStatus {
  return product.estado ?? (product.activo ? 'ACTIVO' : 'FINALIZADO');
}

export function ProductsPage() {
  const { data, loading, error, reload } = useAsyncData(() => productsApi.list(), []);
  const teachers = useAsyncData(() => teachersApi.list(), []);
  const [modal, setModal] = useState<'create' | 'edit' | 'modules' | null>(null);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [moduleName, setModuleName] = useState('');
  const [moduleTeacherId, setModuleTeacherId] = useState('');
  const [editingModuleId, setEditingModuleId] = useState('');
  const [moduleForm, setModuleForm] = useState<ModuleForm>({ nombre_oficial: '', docente_id: '' });
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return data ?? [];
    return (data ?? []).filter((product) =>
      [product.codigo, product.nombre, product.tipo, product.institucion, productStatusLabels[productStatus(product)]]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value)),
    );
  }, [data, search]);

  function openCreate() {
    setForm(emptyForm);
    setSelected(null);
    setMessage('');
    setModal('create');
  }

  function openEdit(product: Product) {
    setSelected(product);
    setForm({
      codigo: product.codigo,
      nombre: product.nombre,
      tipo: product.tipo,
      institucion: product.institucion,
      monto_referencial: product.monto_referencial ?? '',
      estado: productStatus(product),
    });
    setMessage('');
    setModal('edit');
  }

  async function openModules(product: Product) {
    setMessage('');
    setModuleName('');
    setModuleTeacherId('');
    setEditingModuleId('');
    setModuleForm({ nombre_oficial: '', docente_id: '' });
    setAddModuleOpen(false);
    setSelected(await productsApi.get(product.id));
    setModal('modules');
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    const missing = firstMissing(form, ['codigo', 'nombre', 'tipo']);
    if (!selected && missing) {
      setMessage(missing);
      return;
    }
    const editMissing = firstMissing(form, ['nombre']);
    if (selected && editMissing) {
      setMessage(editMissing);
      return;
    }
    try {
      const payload = {
        ...form,
        monto_referencial: form.monto_referencial || null,
        aprobado_ministerio: true,
        modulos: [],
      };

      const product = selected ? await productsApi.update(selected.id, payload) : await productsApi.create(payload);
      setSelected(product);
      setMessage(selected ? 'Producto actualizado' : 'Producto creado. Ahora puedes agregar módulos.');
      await reload();
      if (!selected) {
        setModal('modules');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo guardar el producto');
    }
  }

  async function addModule(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setMessage('');
    const missing = firstMissing({ nombre: moduleName }, ['nombre']);
    if (missing) {
      setMessage(missing.replace('nombre', 'nombre del módulo'));
      return;
    }
    try {
      const product = await productsApi.addModule(selected.id, {
        nombre_oficial: moduleName,
        docente_id: moduleTeacherId || null,
      });
      setSelected(product);
      setModuleName('');
      setModuleTeacherId('');
      setAddModuleOpen(false);
      setMessage('Módulo agregado');
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo agregar el módulo');
    }
  }

  function startEditModule(module: NonNullable<Product['modulos']>[number]) {
    setEditingModuleId(module.producto_modulo_id);
    setModuleForm({
      nombre_oficial: module.nombre_oficial,
      docente_id: module.docente_id ?? '',
    });
    setMessage('');
  }

  async function updateModule(event: FormEvent) {
    event.preventDefault();
    if (!selected || !editingModuleId) return;
    setMessage('');
    const missing = firstMissing(moduleForm, ['nombre_oficial']);
    if (missing) {
      setMessage(missing.replace('nombre_oficial', 'nombre del módulo'));
      return;
    }
    try {
      const product = await productsApi.updateModule(selected.id, editingModuleId, {
        nombre_oficial: moduleForm.nombre_oficial,
        docente_id: moduleForm.docente_id || null,
      });
      setSelected(product);
      setEditingModuleId('');
      setModuleForm({ nombre_oficial: '', docente_id: '' });
      setMessage('Módulo actualizado');
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo actualizar el módulo');
    }
  }

  async function deleteModule(module: NonNullable<Product['modulos']>[number]) {
    if (!selected) return;
    const confirmed = window.confirm(
      Number(module.inscripciones_count ?? 0) > 0
        ? `¿Eliminar el módulo ${module.numero_modulo}: ${module.nombre_oficial}? Se ocultará del producto y se conservará la trazabilidad de sus inscripciones.`
        : `¿Eliminar el módulo ${module.numero_modulo}: ${module.nombre_oficial}?`,
    );
    if (!confirmed) return;
    setMessage('');
    try {
      const product = await productsApi.deleteModule(selected.id, module.producto_modulo_id);
      setSelected(product);
      if (editingModuleId === module.producto_modulo_id) {
        setEditingModuleId('');
      }
      setMessage('Módulo eliminado');
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo eliminar el módulo');
    }
  }

  async function deactivate(product: Product) {
    const confirmed = window.confirm(`¿Desactivar ${product.nombre}?`);
    if (!confirmed) return;
    await productsApi.deactivate(product.id);
    await reload();
  }

  return (
    <section className="panel full">
      <div className="section-heading">
        <div>
          <h2>Catálogo de productos</h2>
          <p>Administra cursos, cursos expertos, diplomados y sus módulos.</p>
        </div>
        <Button onClick={openCreate}>Nuevo producto</Button>
      </div>

      <div className="toolbar">
        <Field
          label="Buscar producto"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Código, nombre, tipo o institución..."
        />
      </div>

      {loading ? <p className="muted">Cargando...</p> : null}
      {error ? <p className="alert error">{error}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Módulos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.codigo}</td>
                <td>{product.nombre}</td>
                <td>{product.tipo}</td>
                <td>{product.num_modulos}</td>
                <td><span className="status">{productStatusLabels[productStatus(product)]}</span></td>
                <td>
                  <div className="row-actions">
                    <Button
                      variant="ghost"
                      disabled={productStatus(product) === 'FINALIZADO'}
                      title={productStatus(product) === 'FINALIZADO' ? 'No se puede modificar un producto finalizado' : 'Editar producto'}
                      onClick={() => openEdit(product)}
                    >
                      Editar
                    </Button>
                    <Button variant="ghost" onClick={() => openModules(product)}>Módulos</Button>
                    <Button
                      variant="danger"
                      disabled={productStatus(product) === 'FINALIZADO'}
                      title={productStatus(product) === 'FINALIZADO' ? 'El producto ya está finalizado' : 'Finalizar producto'}
                      onClick={() => deactivate(product)}
                    >
                      Finalizar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6}>No se encontraron productos con ese criterio.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal title={modal === 'edit' ? 'Editar producto' : 'Crear producto'} open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} size="lg">
        <form className="form-grid two-columns" onSubmit={submitProduct}>
          <Field label="Código" value={form.codigo} disabled={modal === 'edit'} onChange={(event) => setForm({ ...form, codigo: event.target.value })} />
          <Field label="Nombre" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
          <SelectField
            label="Tipo"
            value={form.tipo}
            disabled={modal === 'edit'}
            onChange={(event) => setForm({ ...form, tipo: event.target.value as ProductType })}
            options={[
              { value: 'CURSO', label: 'Curso' },
              { value: 'CURSO_EXPERTO', label: 'Curso experto' },
              { value: 'DIPLOMADO', label: 'Diplomado' },
            ]}
          />
          <Field label="Institución" value={form.institucion} onChange={(event) => setForm({ ...form, institucion: event.target.value })} />
          <Field label="Monto referencial" type="number" min="0" value={form.monto_referencial} onChange={(event) => setForm({ ...form, monto_referencial: event.target.value })} />
          <SelectField
            label="Estado"
            value={form.estado}
            onChange={(event) => setForm({ ...form, estado: event.target.value as ProductStatus })}
            options={[
              { value: 'POR_INICIAR', label: 'Por iniciar' },
              { value: 'ACTIVO', label: 'Activo' },
              { value: 'FINALIZADO', label: 'Finalizado' },
            ]}
          />
          {message ? <p className={message.includes('No se') ? 'alert error' : 'alert success'}>{message}</p> : null}
          <div className="modal-actions">
            <Button type="submit">{modal === 'edit' ? 'Guardar cambios' : 'Crear y agregar módulos'}</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Módulos del producto" open={modal === 'modules'} onClose={() => setModal(null)} size="lg">
        <div className="module-manager">
          <div>
            <h3>{selected?.nombre}</h3>
            <p className="muted">{selected?.codigo}</p>
          </div>
          <div className="module-manager-actions">
            <Button
              type="button"
              disabled={selected ? productStatus(selected) === 'FINALIZADO' : false}
              title={selected && productStatus(selected) === 'FINALIZADO' ? 'No se puede modificar un producto finalizado' : 'Agregar módulo'}
              onClick={() => { setModuleName(''); setModuleTeacherId(''); setMessage(''); setAddModuleOpen(true); }}
            >
              Agregar módulo
            </Button>
          </div>
          {selected && productStatus(selected) === 'FINALIZADO' ? <p className="alert error">Este producto está finalizado y no puede modificarse.</p> : null}
          {teachers.error ? <p className="alert error">{teachers.error}</p> : null}
          {message ? <p className={message.includes('No se') || message.includes('existe') ? 'alert error' : 'alert success'}>{message}</p> : null}
          <div className="module-list">
            {(selected?.modulos ?? []).length === 0 ? <p className="muted">Este producto aún no tiene módulos registrados.</p> : null}
            {(selected?.modulos ?? []).map((module) => (
              <div className="module-item" key={module.producto_modulo_id}>
                <span className="module-number">{module.numero_modulo}</span>
                {editingModuleId === module.producto_modulo_id ? (
                  <form className="module-edit-form" onSubmit={updateModule}>
                    <Field label="Nombre del módulo" value={moduleForm.nombre_oficial} onChange={(event) => setModuleForm({ ...moduleForm, nombre_oficial: event.target.value })} />
                    <TeacherPicker
                      label="Docente"
                      value={moduleForm.docente_id}
                      teachers={teachers.data ?? []}
                      onChange={(docente_id) => setModuleForm({ ...moduleForm, docente_id })}
                    />
                    <div className="row-actions">
                      <Button>Guardar</Button>
                      <Button type="button" variant="ghost" onClick={() => setEditingModuleId('')}>Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <strong>{module.nombre_oficial}</strong>
                      <small>{module.codigo_slot}</small>
                    </div>
                    <small>
                      {module.docente ? `Docente: ${module.docente}` : 'Sin docente asignado'}
                      {Number(module.inscripciones_count ?? 0) > 0 ? ` · ${module.inscripciones_count} inscripción(es)` : ''}
                    </small>
                    <div className="row-actions">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={selected ? productStatus(selected) === 'FINALIZADO' : false}
                        title={selected && productStatus(selected) === 'FINALIZADO' ? 'No se puede modificar un producto finalizado' : 'Editar módulo'}
                        onClick={() => startEditModule(module)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={selected ? productStatus(selected) === 'FINALIZADO' : false}
                        title={Number(module.inscripciones_count ?? 0) > 0 ? 'Eliminar y mantener trazabilidad histórica' : 'Eliminar módulo'}
                        onClick={() => void deleteModule(module)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal title="Agregar módulo" open={addModuleOpen} onClose={() => setAddModuleOpen(false)} size="lg">
        <form className="form-grid two-columns" onSubmit={addModule}>
          <Field label="Nombre del módulo" value={moduleName} onChange={(event) => setModuleName(event.target.value)} />
          <TeacherPicker
            label="Docente del módulo"
            value={moduleTeacherId}
            teachers={teachers.data ?? []}
            onChange={setModuleTeacherId}
          />
          {message && addModuleOpen ? <p className={message.includes('No se') || message.includes('existe') ? 'alert error' : 'alert success'}>{message}</p> : null}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setAddModuleOpen(false)}>Cancelar</Button>
            <Button>Agregar módulo</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

type TeacherPickerProps = {
  label: string;
  value: string;
  teachers: Teacher[];
  onChange: (value: string) => void;
};

function TeacherPicker({ label, value, teachers, onChange }: TeacherPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const activeTeachers = teachers.filter((teacher) => teacher.activo);
  const selectedTeacher = activeTeachers.find((teacher) => teacher.id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTeachers = normalizedQuery
    ? activeTeachers.filter((teacher) =>
      [teacher.nombre, teacher.correo_personal, teacher.celular, teacher.carrera, teacher.pais]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery)),
    )
    : activeTeachers;

  function selectTeacher(teacherId: string) {
    onChange(teacherId);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="field searchable-select">
      <span>{label}</span>
      <button type="button" className="searchable-select-trigger" onClick={() => setOpen((current) => !current)}>
        <span>{selectedTeacher?.nombre ?? 'Sin docente asignado'}</span>
        <small>v</small>
      </button>
      {open ? (
        <div className="searchable-select-panel">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar docente..."
          />
          <button type="button" onClick={() => selectTeacher('')}>
            Sin docente asignado
          </button>
          {filteredTeachers.map((teacher) => (
            <button type="button" key={teacher.id} onClick={() => selectTeacher(teacher.id)}>
              <strong>{teacher.nombre}</strong>
              <small>{teacher.carrera} · {teacher.pais}</small>
            </button>
          ))}
          {filteredTeachers.length === 0 ? <p className="muted">No se encontraron docentes.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
