import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FormBuilder } from '../../components/FormBuilder';
import Layout from '../../layouts/Layout';


export interface FormElement {
  id: number;
  type: string;
}

const Forms: React.FC = () => {

  return (
    <Layout>
      <DndProvider backend={HTML5Backend}>
        <FormBuilder />
      </DndProvider>
    </Layout>
  );
};

export default Forms;
